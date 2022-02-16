import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import { Account } from "./types";
import { NamesCache } from './NamesCache'
import filetype from 'file-type'


const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface SetOptions {
	account: Account
	pic?: Uint8Array
	arweave: Arweave
	jwk?: JWKInterface
}
export const set = async(options: SetOptions)=> {
	const arweave = options.arweave
	const address = await arweave.wallets.jwkToAddress(options.jwk)
	const names = await NamesCache.getInstance()
	const result = await names.set(address, options.account)

	if(result === false) return false;

	let mime: string
	if(options.pic){
		const res = await filetype.fromBuffer(options.pic)
		if(res !== undefined && res.mime.startsWith('image/')){
			mime = res.mime
		}else{
			throw new Error('arweave-id: image mime type not found, ' + res.mime)
		}
	}

	const tx = await arweave.createTransaction({
		...(mime && {data: options.pic} ),
		target: 'v2XXwq_FvVqH2KR4p_x8H-SQ7rDwZBbykSv-59__Avc',
		quantity: '1',
	}, options.jwk )

	tx.addTag('App-Name', 'arweave-id')
	tx.addTag('App-Version', '0.0.3')

	const account = options.account
	tx.addTag('Name', account.name)
	if(account.url) tx.addTag('Url', account.url)
	if(account.text) tx.addTag('Text', account.text)
	if(!mime){
		if(account.avatarTxid) tx.addTag('Avatar', account.avatarTxid)
	}else{
		tx.addTag('Content-Type', mime)
	}
	
	await arweave.transactions.sign(tx, options.jwk)
	let post = 0
	while(post !== 200){
		const postStatus = await arweave.transactions.post(tx)
		// console.log( tx.id, postStatus)
		await sleep(2000)
		post = postStatus.status
		// console.log('postStatus', post)
		// if(post === 410){
		// 	throw new Error(`status 410. ${JSON.stringify(postStatus.statusText)}`)
		// } 
	}
	//update local cache
	if(mime){
		let ac = options.account
		ac.avatarTxid = tx.id
		await names.set(address, ac)
	}
	return tx.id
}
