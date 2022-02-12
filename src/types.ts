
export interface Account {
	name: string
	avatar?: string
	text?: string
	url?: string
}

export interface Accounts {
	[address: string]: Account
}