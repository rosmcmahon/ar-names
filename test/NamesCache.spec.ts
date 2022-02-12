process.env.NODE_ENV = 'test'
import { expect } from 'chai'
import { NamesCache } from '../src/NamesCache'
import col from 'ansi-colors'

describe('NamesCache tests', ()=> {

	it('tests initial instantiation', async()=>{
		// should throw error if something wrong
		try {
			const names = await NamesCache.getInstance()
			expect(true).true			
		} catch (e) {
			console.log(col.red(e.message))
			expect(e.message).false
		}
	}).timeout(0)

	/**
	 * Be careful of the ordering of these tests! 
	 * Static NamesCache object is not isolated
	 */

	it('tests new a valid account', async()=>{
		const names = await NamesCache.getInstance()
		const res = await names.set('fake-wallet-string_012345678901234567890123', {
			name: 'Not A Real Name 202109042228'
		})
		expect(res).true
	}).timeout(0)

	/////////////////////////////////////////
	
	it('tests new account with an invalid name', async()=>{
		const names = await NamesCache.getInstance()
		const res = await names.set('fake-wallet-string_012345678901234567890123', {
			name: 'Testy Mc Testface'
			//in permanent use by aoaJNC8NcKVfgwaUj6kyJi2hKrVGUsRHCGf8RhKnsic
		})
		expect(res).false
	}).timeout(0)

	it('tests updating to an invalid name', async()=>{
		const names = await NamesCache.getInstance()
		const res = await names.set('v2XXwq_FvVqH2KR4p_x8H-SQ7rDwZBbykSv-59__Avc', {
			name: 'Testy Mc Testface',
			//in permanent use by aoaJNC8NcKVfgwaUj6kyJi2hKrVGUsRHCGf8RhKnsic
		})
		expect(res).false
	}).timeout(0)
	
	it('tests updating account text', async()=>{
		const names = await NamesCache.getInstance()
		const res = await names.set('aoaJNC8NcKVfgwaUj6kyJi2hKrVGUsRHCGf8RhKnsic', {
			name: 'Testy Mc Testface',
			//in permanent use by aoaJNC8NcKVfgwaUj6kyJi2hKrVGUsRHCGf8RhKnsic
			text: 'i love text'
		})
		expect(res).true
	}).timeout(0)
	
	it('tests updating account name (freeing)', async()=>{
		const names = await NamesCache.getInstance()
		const res = await names.set('aoaJNC8NcKVfgwaUj6kyJi2hKrVGUsRHCGf8RhKnsic', {
			name: 'Some Different Name',
		})
		expect(res).true
		//set this back so other tests don't fail
		expect(await names.set('aoaJNC8NcKVfgwaUj6kyJi2hKrVGUsRHCGf8RhKnsic', {
			name: 'Testy Mc Testface'
		})).true
	}).timeout(0)

	/////////////////////////////////////////

	it('tests name checking works', async()=>{
		const names = await NamesCache.getInstance()
		const check1 = names.isFree('Testy Mc Testface')
		expect(check1).false
		const check2 = names.isFree('this name should be free blah blah blasdfjkgh')
		expect(check2).true
	}).timeout(0)

	/////////////////////////////////////////

	it('tests can get accounts', async()=>{
		const names = await NamesCache.getInstance()
		const acc = names.get('aoaJNC8NcKVfgwaUj6kyJi2hKrVGUsRHCGf8RhKnsic')
		expect(acc.name).eq('Testy Mc Testface')
	}).timeout(0)

	it('tests getting non-existant accounts', async()=>{
		const names = await NamesCache.getInstance()
		const acc = names.get('fake-wallet-222222_012345678901234567890123')
		expect(acc).undefined
	}).timeout(0)



})