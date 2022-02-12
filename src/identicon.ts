import identicon from 'identicon.js'
//@ts-ignore
import { SHA256 } from 'jshashes'


/**
 * Generate an avatar image from a username. For example, can be 
 * used as a fallback for when no image is supplied.
 * @param name 3id name to turn into an identicon avatar
 */
 export function getIdenticon(name: string): string {
	const hash = new SHA256;
	let identiconString = new identicon(hash.hex(name)).toString();
	return `data:image/png;base64,${identiconString}`;
}