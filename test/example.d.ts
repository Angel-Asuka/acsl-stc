export function CheckTestData(data:TestData):boolean
export declare type TestData = {
    m1 : number,
    m2? : string,
    m3 : string | number | null,
    m4 : 'foo' | 'bar',
    m5? : {
        m51 : number,
        m52 : string
    },
    m6 : Array<string>,
    m7 : string[],
    m8 : [
        string,
        string
    ],
    [k:string] : any
}
