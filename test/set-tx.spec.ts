process.env.NODE_ENV = 'test'
import { expect } from 'chai'
import col from 'ansi-colors'
import Arlocal from 'arlocal'
import { set } from '../src/set-tx'
import { Account } from '../src/types'
import Arweave from 'arweave'
import fs from 'fs'
import sinon from 'sinon'

const jwk = JSON.parse(fs.readFileSync('./secrets/jwk.json', 'utf-8'))
const arlocal =  new Arlocal(1984, false)
const arweave = Arweave.init({ 
	host:'localhost', 
	protocol:'http', 
	port: 1984 
})
const mine = async()=> arweave.api.get(`/mine`)
let timer: NodeJS.Timer

describe('set-tx tests', ()=>{
	
	before(async () => {
		await arlocal.start()
		const address = await arweave.wallets.getAddress(jwk)
		arlocal.getWalletDb().addWallet({ address, balance: 10000000000000})
		console.log('test address:', address)
		console.log('test balance:', arweave.ar.winstonToAr(await arweave.wallets.getBalance(address)))
		timer = setInterval(()=>mine(), 2000)
	})

	it('tests "set" without avatar', async()=>{
		const account: Account = {
			name: 'anything',
		}
		const res = await set({ account, jwk, arweave })
		console.log('txid:', res)
		expect(res).not.false
		expect(res).is.a('string')
	}).timeout(0)

	it('tests "set" with new avatar', async()=>{
		const pic = fs.readFileSync('./test/hotdog-glitch.png')
		const account: Account = {
			name: 'anything',
		}
		const res = await set({ account, pic, jwk, arweave })
		console.log('txid:', res)
		expect(res).not.false
		expect(res).is.a('string')
	}).timeout(0)

	afterEach(()=> sinon.restore()) 

	after(async () => {
		clearInterval(timer)
		await arlocal.stop()
	})
})
