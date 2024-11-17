const puppeteer = require('puppeteer');
const fs = require('fs');

let modArray;
let desiredGameVersion = 1.19;

getFavoriteMods('FavoriteMods.txt');
fetchModInfo();

function getFavoriteMods(fileName){
    console.log("\nParsing mod list...")
    fs.readFile(fileName, 'utf8', function(err, data) {
        if (err) {
            console.log(err);
            return;
        }

        let inputString = data.toString();
        modArray = inputString.split(',\r\n');
        //console.log(modArray);
        return modArray;
    })
}

async function fetchModInfo() {
    const browser = await puppeteer.launch({
        headless:false, 
        defaultViewport: null, 
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();

    console.log('Fetching data on ' + modArray.length + ' mods...');
    console.log("\n----------------------------------------\n");
    let unupdatedModArray = [];

    for (let i = 0; i < modArray.length; i++) {
        await page.goto(modArray[i]);

        console.log((i+1) + '/' + modArray.length + ' tasks completed');

        let nameElement = await page.waitForSelector('.name-container > h1');
        let modName = await nameElement.evaluate(nameElement => nameElement.textContent);
        //console.log('\tName: ' + modName);

        let versionElement = await page.waitForSelector('#recent-files > h4:nth-child(1)');
        let modVersion = await versionElement.evaluate(versionElement => versionElement.textContent);
        //console.log('\tVersion: ' + modVersion);

        let versionArray = modVersion.split(' ');
        versionArray.shift();
        modVersion = versionArray[0];
        let modVersionFloat = parseFloat(modVersion).toFixed(2);
        //console.log(versionArray);

        let lastUpdateElement = await page.waitForSelector('#__next > div > main > div.ads-layout > div.ads-layout-content > div > aside > div.aside-box.project-details-box > section:nth-child(2) > dl > dd:nth-child(4) > span');
        let modLastUpdate = await lastUpdateElement.evaluate(lastUpdateElement => lastUpdateElement.textContent);
        //console.log('\tLast Update: ' + modLastUpdate + '\n');

        let thisMod = {
            Name: modName, 
            Version: modVersionFloat, 
            LastUpdate: modLastUpdate
        };

        if (thisMod.Version < desiredGameVersion) {
            unupdatedModArray.push(thisMod);
        }
        
    }

    console.log("\n----------------------------------------");
    console.log("\n" + (modArray.length - unupdatedModArray.length) + "/" + modArray.length + " (" + ((100*(modArray.length - unupdatedModArray.length)/modArray.length).toFixed(0)) + "%) of your mods have been updated for Minecraft version " + desiredGameVersion + "+");
    console.log("The following mods are NOT updated");

    for (let i = 0; i < unupdatedModArray.length; i++) {
        console.log('\nName: ' + unupdatedModArray[i].Name);
        console.log('Version: ' + unupdatedModArray[i].Version);
        console.log('Last Update: ' + unupdatedModArray[i].LastUpdate);
    }

    await browser.close();
};


