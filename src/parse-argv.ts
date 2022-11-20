import process from 'node:process'

/**
 * COPY FROM acsl-fw
 * https://github.com/Angel-Asuka/acsl-fw
 * npm i @acsl/fw
 */

/**
 * 解析命令行参数
 * @param {object} keys 带值参数表
 * @param {object} options 选项参数表
 * @param {Array} argv 命令行 
 * @param {function} onerr 错误处理函数
 * @example
 *  It's never been a bad choice to setting up onerr like this: 
 *   (k)=>{
 *       if(t in options)
 *           console.log(`Uncomplete option ${prev}`)
 *       else
 *           console.log(`Unknown option ${prev}`)
 *       process.exit()
 *   }
 */
export function parseArgv(keys?:any, options?:any, argv?:Array<string>, onerr?:(k:string)=>void):any{
    if(keys == null) keys = {}
    if(options == null) options = {}
    if(argv == null) argv = process.argv.slice(2)
    if(onerr == null) onerr=(k)=>{}
    const cmdline = {} as {[k:string]:string}
    let prev = ''
    for(let v of argv){
        if(prev in keys){
            cmdline[keys[prev]] = v
            prev = ''
        }else if(prev != ''){
            onerr(prev)
        }else if(v in options){
            cmdline[options[v]] = v
        }else
            prev = v
    }
    if(prev != '') onerr(prev)
    return cmdline
}