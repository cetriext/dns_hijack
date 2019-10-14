module.exports = function progresBuilder(percent){
    if(percent > 100){
        percent = 100;
    } else if(percent < 0){
        percent = 1;
    }
    let string = "";
    for(let i = 1; i < percent; i++){
        string += "="
        if(i === percent - 1 ){
            string += ">"
        }
    }
    return string;
}