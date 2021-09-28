document.addEventListener('DOMContentLoaded', function () {
    const selector = document.getElementById("selector")
    const button = document.getElementsByClassName("button")[0]
    const toOptions=document.getElementsByTagName('a')[0]
    const langs = [['ru', 'Russian'], ['en', 'English'], ['fr', 'French'], ['de', 'Deutsch'], ['uk', 'Ukrainian'], ['it', 'Italian'], ['cs', 'Czech'], ['pl', 'Polish'],['sr','Serbian']]

    let isOn

    const changeView = (state) => {
        if (state) {
            button.setAttribute('src', './pics/turn_on_button_red.svg')
            document.body.style.backgroundImage = "linear-gradient(0deg, rgba(80,174,244,1) 0%, rgba(255,252,252,1) 50%, rgba(80,174,244,1) 100%)"
            selector.disabled = false
        } else {
            button.setAttribute('src', './pics/turn_on_btn.svg')
            document.body.style.backgroundImage = "linear-gradient(0deg, rgba(30,66,92,1) 0%, rgba(75,74,74,1) 50%, rgba(27,58,82,1) 100%)"
            selector.disabled = true
        }

    }


    chrome.storage.sync.get(['state'], function (result) {
        isOn = result.state !== 'off';
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {message: "set_state", state: isOn});
        })
        changeView(isOn)
    });


    button.addEventListener('click', () => {
        console.log('тык')
        isOn = !isOn
        changeView(isOn)
        chrome.storage.sync.set({state: isOn ? 'on' : 'off'});
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {message: "set_state", state: isOn});
        })
    }, false)

    selector.addEventListener('change', () => {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {message: "set_lang", elem: langs[selector.selectedIndex][0]});
            chrome.storage.sync.set({lang: langs[selector.selectedIndex][0]});
        })
    }, false)

    toOptions.addEventListener('click',()=>{chrome.runtime.openOptionsPage()},false)

    chrome.storage.sync.get(['lang'], function (result) {
        console.log('result is ', JSON.stringify(result))
        const langIndex = langs.flat().indexOf(result.lang) / 2
        selector.value = langs[langIndex][1]
    });
    for (let i = 0; i < langs.length; i++) {
        let opt = document.createElement('option');
        opt.value = langs[i][1]
        opt.innerHTML = langs[i][1];
        selector.appendChild(opt);
    }
}, false)