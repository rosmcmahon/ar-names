import { NamesCache } from '../src' //or 'arid'

const main = async()=> {
	// this should probably be called on page load to cache names in advance
	const names = await NamesCache.getInstance()

	// perhaps you can get this from your wallet provider or extract from a jwk
	const myaddress = 'v2XXwq_FvVqH2KR4p_x8H-SQ7rDwZBbykSv-59__Avc'

	let account = names.get(myaddress)

	console.log('Name:', account.name)
	console.log(`Avatar: https://arweave.net/${account.avatarTxid}`)
	
}
main()