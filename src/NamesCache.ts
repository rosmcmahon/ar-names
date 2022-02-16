import axios from 'axios'
import { Account, Accounts } from './types'
import v1names from './v1names/v1transformed'
import * as gql from 'ar-gql'
import { GQL_URL } from './constants'
import { logdim, logred } from './utils/log'

const getHeight = async()=> {
	const query = "query($minBlock: Int){ blocks( height: { min: $minBlock } first: 1 sort: HEIGHT_DESC ){ edges { node {height}}}}"
	const { data } =  await axios.post(GQL_URL, {
		query,
	})
	return +data.data.blocks.edges[0].node.height
}

export class NamesCache { 
	private takenNames: Set<string>
	private accounts: Accounts
	private lastHeight = 0

	/* singleton biolerplate */
	private static instance: NamesCache
	private constructor() {}
	public static async getInstance(): Promise<NamesCache>{
		if(!NamesCache.instance){
			NamesCache.instance = new NamesCache()
			await this.instance.update()
		}
		return NamesCache.instance
	}

	/**
	 * this should be very fast - example use: input text box onChange function
	 * @param name - check if name is in use
	 * @returns - false if in use. true if name is free
	 */
	public isFree = (name: string)=> {
		return !this.takenNames.has(name)
	}

	public get = (address: string)=> this.accounts[address]
	
	private async update(){
		/* initial load of v1 names */
		if(!this.takenNames){
			logdim('arweave-id: loading previous v1 names')
			this.accounts = v1names
			this.takenNames = new Set()
			for (const key in this.accounts) {
				this.takenNames.add(this.accounts[key].name)
			}
		}

		// call once
		const height = await getHeight() 

		if(height > this.lastHeight){
			logdim('arweave-id: updating NamesCache')
			
			this.lastHeight = height
			//update v2 txs in order
			const records = await queryV2Records(this.lastHeight, height)
			
			for(const record of records){
				await this.add(record.address, record.account as Account)
			}

			/* sanity test on new update */
			const numAccounts = Object.keys(this.accounts).length
			const numTakenNames = this.takenNames.size

			if(process.env.NODE_ENV === 'test'){
				logdim('number of accounts', numAccounts)
				logdim('takenNames.size', numTakenNames)
			}

			if(numAccounts !== numTakenNames){
				throw new Error('arweave-id: internal error updating NamesCache')
			}
		}
	}

	public set = async(address: string, account: Account)=> {
		await this.update()
		return this.add(address, account)
	}

	private add = async(address: string, account: Account) => {
		const name = account.name
		const added = true;

		if(this.takenNames.has(name)){
			if(!this.accounts[address] || this.accounts[address].name !== name ){
				logred(`arweave-id: ${address} bad record. Name '${name}' is taken aleady.`)
				return false;
			}else{
				this.accounts[address] = Object.assign(this.accounts[address], account)
			}
		}else{
			this.takenNames.add(name)
			if(!this.accounts[address]){
				this.accounts[address] = account
			}else{
				const oldName =this.accounts[address].name
				if(process.env.NODE_ENV === 'test') logdim('freeing name' + oldName)
				this.takenNames.delete(oldName)
				this.accounts[address] = Object.assign(this.accounts[address], account)
			}
		}

		/* sanity test on new update */
		const numAccounts = Object.keys(this.accounts).length
		const numTakenNames = this.takenNames.size

		if(numAccounts !== numTakenNames){
			throw new Error('arweave-id: internal error updating NamesCache')
		}

		return true
	}
}

interface Record { 
	address: string
	account: Partial<Account> 
}

const queryV2Records = async(minBlock: number, maxBlock: number)=> {
	/* actually, this handles both v2 and v3 records. v3 have a new Avatar tag containing a txid. this allows compatiblility with previous data, and also stops the waseful practise of reuploading the image data for each change to the account.*/
	
	const query = `
	query($cursor: String, $minBlock: Int, $maxBlock: Int){
		transactions(
			tags: [
				{name: "App-Name", values: ["arweave-id"]},
				{name: "App-Version", values: ["0.0.2", "0.0.3"]}
			]
			block: { min: $minBlock, max: $maxBlock}
			first: 100
			after: $cursor
			sort: HEIGHT_ASC
		){
			pageInfo{hasNextPage}
			edges{
				cursor
				node{
					id
					owner{address}
					tags{name, value}
			}}
		}
	}
	`
	const results = await gql.all(query)
	const records: Record[] = []

	if(process.env.NODE_ENV === 'test'){
		logdim('total results', results.length)
	}

	for (const result of results) {

		// if(process.env.NODE_ENV === 'test'){
		// 	console.log('\ntxid:',result.node.id)
		// 	console.log('address:',result.node.owner.address)
		// 	console.log(result.node.tags)
		// }
	
		let record: Record = {
			address: result.node.owner.address,
			account: {},
		}
		let sanity1 = false
		let sanity2 = false
		let atomicAvatar: string
		for (const tag of result.node.tags) {
			if(tag.name === 'Name') record.account.name = tag.value
			if(tag.name === 'Url') record.account.url = tag.value
			if(tag.name === 'Text') record.account.text = tag.value
			if(tag.name === 'Content-Type'){
				if(tag.value.startsWith('image')){
					atomicAvatar = result.node.id
				}
			}
			if(tag.name === 'Avatar') record.account.avatarTxid = tag.value
			if(tag.name === 'App-Name' && tag.value === 'arweave-id') sanity1 = true
			if(tag.name === 'App-Version' && ['0.0.2', '0.0.3'].includes(tag.value)) sanity2 = true
		}
		if(atomicAvatar) record.account.avatarTxid = atomicAvatar
		/* strip dataItems, too easy to spam */
		if(result.node.parent){
			logred(`ar-names: dataItems are currently not supported, as with Smartweave`)
			continue;
		}
		/* graphql v1 started to return crazy results, same might happen again */
		if(!sanity1 || !sanity2){
			throw new Error(`ar-names: GQL is returning nonsense results. App-Name: !arweave-id, App-Version: !0.0.2`)
		}
		/* normal error checking */
		if(!record.account.name){
			logred('ar-names: bad record. no Name for', record.address)
			continue;
		}
		records.push(record)
	}

	// if(process.env.NODE_ENV === 'test') console.log(records)

	return records
}
