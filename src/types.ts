
export interface Account {
	name: string
	avatarTxid?: string
	text?: string
	url?: string
}

export interface Accounts {
	[address: string]: Account
}