import fetch from "node-fetch"

const reqTranslate = () => {
    fetch("https://microsoft-translator-text.p.rapidapi.com/translate?api-version=3.0&to=%3CREQUIRED%3E&textType=plain&profanityAction=NoAction", {
        "method": "POST",
        "params":
            {"api-version": '3.0', "to": 'ru', "textType": 'plain', "profanityAction": "NoAction"},
        "headers": {
            "content-type": "application/json",
            "x-rapidapi-host": "microsoft-translator-text.p.rapidapi.com",
            "x-rapidapi-key": "c26b23dd8fmshdd3a251db7ca47fp1b0f2cjsnd350dd6bac9e",
        },
        "body": [
            {
                "Text": "I would really like to drive your car around the block a few times."
            }
        ]
    })
        .then(response => {
            console.log(response);
        })
        .catch(err => {
            console.error(err);
        });

}

reqTranslate()

module.exports = reqTranslate