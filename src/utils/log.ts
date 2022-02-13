import col from 'ansicolor'


export const logdim = (...args: any[]) => {
	const text = args.join(' ')
	if (typeof window === 'undefined') {
		console.log(col.dim(text))
	}else{
		console.log(`%c${text}`, 'color: #888888')
	} 
}

export const logred = (...args: any[]) => {
	const text = args.join(' ')
	if (typeof window === 'undefined') {
		console.log(col.red(text))
	}else{
		console.log(`%c${text}`, 'color: #ff0000')
	} 
}