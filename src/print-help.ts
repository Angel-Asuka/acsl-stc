import { format } from "node:path"

export function printHelp(){
    console.log('Usage: stc [OPTIONS]')
    console.log('   Normally, stc read settings from \'./stc.json\'')
    console.log('   you may specify a different with -c option')
    console.log('---------')
    console.log('Configure file should be a text file in json format:')
    console.log('       {')
    console.log('           "inDir": "./test",')
    console.log('           "outDir": "./",')
    console.log('           "outFile": null,')
    console.log('           "indentSize": 4')
    console.log('       }')
    console.log('   inDir   specifies the source directory.')
    console.log('   outDir  specifies the output files should be written')
    console.log('           in with the source directory struct')
    console.log('   outFile [OPTIONAL] specify which file stc should')
    console.log('           pack all code in. If this parameter has')
    console.log('           been set, outDir will be ignored.')
}