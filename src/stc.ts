import YAML from 'yaml'
import fs, { mkdir } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { printHelp } from './print-help.js'
import { parseArgv } from './parse-argv.js'
import { Data } from './declare.js'

const config : any = {
    inDir: './',
    outDir: './',
    outFile: '',
    indentSize: 4
}

const options = parseArgv({'-c': 'config_file'}, {'-h': 'show_help'}, undefined, (k:string)=>{ printHelp() })
const config_file = options.config_file || './stc.json'

if('show_help' in options){
    printHelp()
    process.exit()
}

try{
    const cfg = JSON.parse(fs.readFileSync(config_file).toString())
    for(let k in config){
        if(cfg[k]) config[k] = cfg[k]
    }
}catch(e){}

const INDENT = ' '.repeat(config.indentSize)

const fd_single_decl = config.outFile?fs.openSync(`${config.outFile}.d.ts`, "w"):-1
const fd_single_check = config.outFile?fs.openSync(`${config.outFile}.js`, "w"):-1

function mkdirRe(p:string){
    if(!fs.existsSync(p)){
        mkdirRe(path.dirname(p))
        try{fs.mkdirSync(p)}catch(e){console.log(e)}
    }
}

function openOutFileInOutDir(srcFile:string){
    const sf = srcFile.replace(config.inDir, config.outDir)
    const dir = path.dirname(sf)
    mkdirRe(dir,)
    return fs.openSync(sf, "w")
}

function proc(path:string){
    try{
        const stat = fs.statSync(path)
        if(stat.isDirectory()){
            if(path[path.length-1] != '/') path += '/'
            const list = fs.readdirSync(path)
            for(let item of list)
                proc(path + item)
        }else if(path.length > 4 && path.substring(path.length-4).toLowerCase() == '.yml') {
            console.log(path)
            let fd_decl = (fd_single_decl>=0)?fd_single_decl:openOutFileInOutDir(`${path.substring(0,path.length-4)}.d.ts`)
            let fd_check = (fd_single_check>=0)?fd_single_check:openOutFileInOutDir(`${path.substring(0,path.length-4)}.js`)
            try{
                const content = YAML.parse(fs.readFileSync(path).toString())
                for(let k in content){
                    const dt = new Data(k, content[k], 0)
                    dt.output(fd_decl, fd_check, INDENT)
                }
            }catch(e){console.log(e)}
            if(fd_decl != fd_single_decl) fs.closeSync(fd_decl)
            if(fd_check != fd_single_check) fs.closeSync(fd_check)

        }
    }catch(e){}
}


proc(config.inDir)

if(fd_single_decl >= 0) fs.closeSync(fd_single_decl)
if(fd_single_check >= 0) fs.closeSync(fd_single_check)