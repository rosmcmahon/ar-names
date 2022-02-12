import { writeFile } from "fs/promises"
import v1claimed from "./v1claimed";
import { Accounts } from '../src/types'

const objectFlip = async(obj: Object)=> {
  const ret: Accounts = {}
  Object.keys(obj).forEach(key => {
    ret[obj[key]] = { name: key }
  })
  await writeFile(
		'src/utils/v1transformed.ts', 
		'export default' + JSON.stringify(ret)
	)
}
objectFlip(v1claimed);