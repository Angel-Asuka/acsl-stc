export function CheckTestData(data){
    if(data == null) return false
    if(!(typeof data['m1'] == "number")) return false
    if(data['m2'] != null){
        if(!(typeof data['m2'] == "string")) return false
        if(!(data['m2'].length > 5 && data['m2'].length < 16)) return false
    }
    if(!((typeof data['m3'] == "string") || (typeof data['m3'] == "number") || (data['m3'] == null))) return false
    if(!((data['m4'] == 'foo') || (data['m4'] == 'bar'))) return false
    if(data['m5'] != null){
        if(!(typeof data['m5']['m51'] == "number")) return false
        if(!(typeof data['m5']['m52'] == "string")) return false
    }
    if(data['m6'] == null) return false
    if(!(data['m7'].length > 5)) return false
    if(!(data['m8'].length != 2)) return false
    if(!(typeof data['m8'][0] == "string")) return false
    if(!(typeof data['m8'][1] == "string")) return false
    return true
}
