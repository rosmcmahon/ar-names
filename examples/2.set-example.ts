/**
 * Setting data example.
 */
import { Account, Names } from '../src' //or 'ar-names'
import Arweave from 'arweave'
import { readFileSync } from 'fs'

const arweave = Arweave.init({ host: 'arweave.net'})
const jwk = JSON.parse(readFileSync('./secrets/jwk.json', 'utf-8'))

const main = async()=> {
	// this should probably be called on page load to cache names in advance
	const names = await Names.getInstance()

	// perhaps you can get this from your wallet provider or extract from a jwk
	const myaddress = await arweave.wallets.jwkToAddress(jwk)
	console.log(myaddress)

	// check is name free - this is very fast, can be used for real-time checking on text input
	const newName = 'RosMcTest'
	console.log(`is the name '${newName}' free?`, names.isFree(newName))
	
	// retrieve or create a new Account object
	// either 
	let account = names.get(myaddress)
	// or
	let newAccount: Account = {
		name: newName,
		// avatarTxid, //<= for previously uploaded image
		// etc.
	}

	// set and write the new Account date
	const result = await names.set({
		account: newAccount,
		// pic, //<= for a new binary avatar picture upload
		arweave,
		jwk, //<= not required when using arweave.app or arconnect.io
	})

	if(result !== false){
		console.log(`check set tx status: https://arweave.net/tx/${result}/status`)
		//or
		console.log('status:', await arweave.transactions.getStatus(result))
	}else{
		throw new Error(`Error sending tx for account '${newAccount.name}'`)
	}

}
main()