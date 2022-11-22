import fs from 'node:fs'

const RNUM = /^[0-9]*(\.[0-9]*)?(e([0-9]*.)*[0-9]+)?$/

const COMA = Buffer.from(',\n')
const NOCOMA = Buffer.from('\n')
const ENDBLOCK = Buffer.from('}\n')
const FIXEDTYPES = {'object':1, 'number':2, 'string':3}

export class Data{    
    key: string = ''
    idx: number = 0
    type: 'value' | 'object' | 'array' = 'value'
    decl: string = 'any'
    optional:  boolean = false
    child: Data[] = []
    check: string[] = []
    level: number = 0
    chkname: string = 'data'

    constructor(k:string | number, def: any, lv: number, cn: string = ''){
        this.level = lv
        if(typeof k == 'string'){
            if(/^[a-zA-Z_\$][a-zA-Z_\$0-9]*\?$/.test(k)){
                this.key = k.substring(0, k.length-1)
                this.optional = true
            }else
                this.key = k
            if(cn != '') this.chkname = `${cn}['${this.key.replaceAll('\'','\\\'')}']`
        }else{
            this.idx = k
            if(cn != '') this.chkname = `${cn}[${this.idx}]`
        }

        if(typeof def == 'object'){
            if(def == null){
                return
            }else if(def.constructor == Array){
                this.type = 'array'
                for(let i=0; i<def.length; ++i)
                    this.child.push(new Data(i, def[i], lv + 1, this.chkname))
                if(this.child.length == 0){
                    this.type = 'value'
                    this.decl = 'Array<any>'
                }else
                    this.check.push(`${this.chkname}.length != ${this.child.length}`)
            }else{
                this.type = 'object'
                for(let k in def){
                    this.child.push(new Data(k, def[k], lv + 1, this.chkname))
                }if(this.child.length == 0){
                    this.type = 'value'
                    this.decl = '{[k:string]:any}'
                }

            }
        }else if(typeof def == 'string'){
            const d = def.trim().split('@')
            this.decl = d[0].trim()
            if(this.decl == '') this.decl = 'any'
            if(this.decl.indexOf('|') >= 0){
                const vals = this.decl.split('|')
                let chkstr = ''
                for(let v of vals){
                    const vx = v.trim()
                    if(chkstr != '') chkstr += ' || '
                    if(vx in FIXEDTYPES){
                        chkstr += `(typeof ${this.chkname} == "${vx}")`
                    }else{
                        if(typeof vx == 'number' || RNUM.test(`${vx}`))
                            chkstr += `(${this.chkname} == ${vx})`
                        else if(typeof vx == 'string' && (vx[0] == "'" || vx[0] == '"'))
                            chkstr += `(${this.chkname} == ${vx})`
                        else
                            chkstr += `(${this.chkname} == '${vx}')`
                    }
                }
                if(chkstr != '')
                this.check.push(chkstr)
            }else if(this.decl in FIXEDTYPES)
                this.check.push(`typeof ${this.chkname} == "${this.decl}"`)
            else{
                if(typeof this.decl == 'number' || RNUM.test(`${this.decl}`))
                    this.check.push(`${this.chkname} == ${this.decl}`)
                else if(typeof this.decl == 'string' && (this.decl[0] == "'" || this.decl[0] == '"')) 
                    this.check.push(`${this.chkname} == ${this.decl}`)
                else
                    this.check.push(`${this.chkname} == "${this.decl}"`)
            }
            for(let i=1; i<d.length; ++i)
                this.check.push(d[i].trim().replaceAll('$', this.chkname))
        }else if(typeof def == 'number'){
            this.decl = `${def}`
            this.check.push(`${this.chkname} == ${def}`)
        }
    }

    output_child(fdDecl:number, fdCheck:number, INDENT:string, chkIndent:number){
        for(let i=0; i<this.child.length; ++i){
            this.child[i].output(fdDecl, fdCheck, INDENT, chkIndent)
            fs.writeSync(fdDecl, (i < this.child.length - 1)?COMA:NOCOMA)
        }
    }

    output(fdDecl:number, fdCheck:number, INDENT:string, chkIndent:number = 1){
        if(this.level == 0){
            fs.writeSync(fdDecl, Buffer.from(`export function Check${this.key[0].toUpperCase()}${this.key.substring(1)}(data:${this.key}):boolean\n`))
            fs.writeSync(fdDecl, Buffer.from(`export declare type ${this.key} = `))
            fs.writeSync(fdCheck, Buffer.from(`export function Check${this.key[0].toUpperCase()}${this.key.substring(1)}(data){\n`))
        }else{
            if(this.key == ''){
                fs.writeSync(fdDecl, Buffer.from(`${INDENT.repeat(this.level)}`))
            }else if(this.optional){
                fs.writeSync(fdDecl, Buffer.from(`${INDENT.repeat(this.level)}${this.key}? : `))
            }else{
                fs.writeSync(fdDecl, Buffer.from(`${INDENT.repeat(this.level)}${this.key} : `))
            }
        }

        if(this.key[0] != '['){
            if(this.optional){
                if(this.check.length > 0 || this.child.length > 0){
                    fs.writeSync(fdCheck, Buffer.from(`${INDENT.repeat(chkIndent)}if(${this.chkname} != null){\n`))
                    chkIndent++
                    for(let c of this.check){
                        fs.writeSync(fdCheck, Buffer.from(`${INDENT.repeat(chkIndent)}if(!(${c})) return false\n`))
                    }
                }
            }else if(this.check.length == 0){
                fs.writeSync(fdCheck, Buffer.from(`${INDENT.repeat(chkIndent)}if(${this.chkname} == null) return false\n`))
            }else{
                for(let c of this.check){
                    fs.writeSync(fdCheck, Buffer.from(`${INDENT.repeat(chkIndent)}if(!(${c})) return false\n`))
                }
            }
        }

        switch(this.type){
            case 'array':
                fs.writeSync(fdDecl, Buffer.from('[\n'))
                this.output_child(fdDecl, fdCheck, INDENT, chkIndent)
                fs.writeSync(fdDecl, Buffer.from(`${INDENT.repeat(this.level)}]`))
                break;
            case 'object':
                fs.writeSync(fdDecl, Buffer.from('{\n'))
                this.output_child(fdDecl, fdCheck, INDENT, chkIndent)
                fs.writeSync(fdDecl, Buffer.from(`${INDENT.repeat(this.level)}}`))
                break;
            case 'value':
                fs.writeSync(fdDecl, Buffer.from(this.decl))
                break;
        }

        if(this.key[0] != '['){
            if(this.optional){
                if(this.check.length > 0 || this.child.length > 0){
                    chkIndent--
                    fs.writeSync(fdCheck, Buffer.from(`${INDENT.repeat(chkIndent)}}\n`))
                }
            }
        }

        if(this.level == 0){
            fs.writeSync(fdDecl, NOCOMA)
            if(this.key[0] != '['){
                fs.writeSync(fdCheck, Buffer.from(`${INDENT}return true\n`))
                fs.writeSync(fdCheck, ENDBLOCK)
            }
        }
    }
}