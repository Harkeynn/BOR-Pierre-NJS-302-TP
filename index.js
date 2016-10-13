#!/usr/bin/env node
//Dependencies
const commander = require('commander')
const inquirer = require('inquirer')
const fs = require('fs')
const api = require('marvel-comics-api')

//Differents commander's options (type myhero -[option])
commander
.version('1.0.0')
.option('-m, --menu', 'Go to the menu')
.option('-c, --comics [name]', 'A list of comics relative to [name]')
.option('-s, --series [name]', 'A list of series relative to [name]')
.option('-t, --stories [name]', 'A list of stories relative to [name]')
.option('-e, --events [name]', 'A list of events relative to [name]')

commander.parse(process.argv)

//Global variables
var resId = []
var resName = []
var j = 0
var saveCheck = [0, 0, 0, 0]
var saveOrNot = 0
var svName = ''

//Search function
function search(){
    //Main menu
    inquirer.prompt([
        {
            type: 'input',
            message: 'Enter a name (or the first letters) of hero : ',
            name: 'name'
        }
    ]).then((answerName) => {
        var heroname = answerName.name
        //API call : api(string (like 'events' or 'comics'), callback)
        api('characters', {
            //API keys
            publicKey: 'a066bf2e247e38b495c1c885077514e7',
            privateKey: '42c3bd44a7c1abacb2faa237ea38595ed7d87002',
            //Maximum delay time (ms)
            timeout: 4000,
            //Request's parameters, here the name searched must begin by the string heroname
            query: {
                nameStartsWith: heroname
            }
        }, function (err, body) {
            //Error management
            if (err) throw err
            //resName and resId will be tables with the result's name and ID
            var i = 0;
            var l = body.data.results.length
            //Errors management
            if(l == 0) throw 'Name not found'
            for(i=0;i<l;i++){
                resName.push(body.data.results[i].name)
                resId.push(body.data.results[i].id)
            }
            //Display the result of the search with inquirer
            inquirer.prompt([
                {
                    type: 'list',
                    message: 'Choose a hero :',
                    name: 'heroList',
                    choices: resName
                }
            ]).then((answerHero) => {
                //This for loop is used to find the position of the chosen name in resName so we can make it match with an ID in resId
                for(i=0;i<l;i++){
                    if(resName[i] == answerHero.heroList){
                        j = i
                    }
                }
                //'Save or consult' menumade with inquirer
                inquirer.prompt([
                    {
                        type: 'list',
                        message: 'Do you want to save or consult informations ?',
                        name: 'saveOrConsult',
                        choices: [
                            'Save',
                            'Consult'
                        ]
                    }
                ]).then((answer) => {
                    if(answer.saveOrConsult == 'Consult'){
                        //Variable used in result()
                        saveOrNot = 0
                        //Ask what the user wants to see about his research
                        inquirer.prompt([
                            {
                                type: 'list',
                                message: 'What do you want to see ?',
                                name: 'choice',
                                choices: [
                                    'Comics',
                                    'Series',
                                    'Stories',
                                    'Events',
                                    '<- Back'
                                ]
                            }
                        ]).then((answerList) => {
                            //Every choice (exept '<- Back') will use result() to display results. '<- Back' will call back the main function to restart the process
                            if(answerList.choice == 'Comics'){
                                result('comics', answerList.choice)
                            }else if(answerList.choice == 'Series'){
                                result('series', answerList.choice)
                            }else if(answerList.choice == 'Stories'){
                                result('stories', answerList.choice)
                            }else if(answerList.choice == 'Events'){
                                result('events', answerList.choice)
                            }else{
                                catalog()
                            }
                        //Errors management
                        }).catch((err) => {
                            console.log('Error : ', err)
                        })
                    }else{
                        //Variable used in result()
                        saveOrNot = 1
                        //This menu is used to know how does the user want to name his save fileand  what item(s) does he want to save
                        inquirer.prompt([
                            {
                                type: 'input',
                                message: 'Name of the save file :',
                                name: 'saveName'
                            }, {
                                type: 'checkbox',
                                message: 'What do you want to save ?',
                                name: 'saveList',
                                choices: [
                                    'Comics',
                                    'Series',
                                    'Stories',
                                    'Events'
                                ]
                            }
                        ]).then((saveItems) => {
                            svName = saveItems.saveName
                            l = saveItems.saveList.length
                            //This for loop will check which item(s) was(were) checked and call result()
                            for(i=0;i<l;i++){
                                if(saveItems.saveList[i] == 'Comics' && saveCheck[i] == 0){
                                    saveCheck[i] = 1
                                    result('comics', saveItems.saveList[i])
                                }
                                if(saveItems.saveList[i] == 'Series' && saveCheck[i] == 0){
                                    saveCheck[i] = 2
                                    result('series', saveItems.saveList[i])
                                }
                                if(saveItems.saveList[i] == 'Stories' && saveCheck[i] == 0){
                                    saveCheck[i] = 3
                                    result('stories', saveItems.saveList[i])
                                }
                                if(saveItems.saveList[i] == 'Events' && saveCheck[i] == 0){
                                    saveCheck[i] = 4
                                    result('events', saveItems.saveList[i])
                                }
                            }
                        })
                    }
                //Errors management
                }).catch((err) => {
                    console.log('Error : ', err)
                })
            //Errors management
            }).catch((err) => {
                console.log('Error : ', err)
            })
        })
    //Errors management
    }).catch((err) => {
        console.log('Error : ' + err)
    })
}

//This function is used if the user search directly an item (a comic, a story...) with commander
function commanderCatalog(name, value, type){
    var heroname = name
    //API call : api(string (like 'events' or 'comics'), callback)
    api('characters', {
        //API keys
        publicKey: 'a066bf2e247e38b495c1c885077514e7',
        privateKey: '42c3bd44a7c1abacb2faa237ea38595ed7d87002',
        //Maximum delay time (ms)
        timeout: 4000,
        //Request's parameters, here the name searched must begin by the string heroname
        query: {
            nameStartsWith: heroname
        }

    }, function (err, body) {
        //Error management
        if (err) throw err
        //resName and resId will be tables with the result's name and ID
        var i = 0;
        var l = body.data.results.length
        //If the name is not valid, this will redirect the user to catalog, where he will be invited to type a new name
        if(l == 0){
            console.log('Name not found')
            catalog()
        }
        //This loop fill resName and resId with the results
        for(i=0;i<l;i++){
            resName.push(body.data.results[i].name)
            resId.push(body.data.results[i].id)
        }
        //Display the result of the search with inquirer
        inquirer.prompt([
            {
                type: 'list',
                message: 'Choose a hero :',
                name: 'heroList',
                choices: resName
            }
        ]).then((answerHero) => {
            //This for loop is used to find the position of the chosen name in resName so we can make it match with an ID in resId
            for(i=0;i<l;i++){
                if(resName[i] == answerHero.heroList){
                    j = i
                }
            }
            result(value, type)
        //Errors management
        }).catch((err) => {
            console.log('Error : ', err)
        })
    })
}

//Function used to display a list of results with inquirer
function result(value, type){
    //API call : api(string (like 'events' or 'comics'), callback)
    api(value, {
        //Marvel API key
        publicKey: 'a066bf2e247e38b495c1c885077514e7',
        privateKey: '42c3bd44a7c1abacb2faa237ea38595ed7d87002',
        //Maximum delay time (ms)
        timeout: 4000,
        //Request parameters, here characters must match the j ID that we determined above, with the for loop
        query: {
            characters: resId[j]
        }
    }, function (err, body) {
        //Errors management
        if (err) throw err
        i = 0;
        l = body.data.results.length
        //Errors management
        if(l == 0) throw 'No result found'
        let resList = []
        for(i=0;i<l;i++){
            resList.push(body.data.results[i].title)
        }
        //If the user choose 'Consult', display the results...
        if(saveOrNot == 0){
            inquirer.prompt([
                {
                    type: 'list',
                    message: type + ' where ' + resName[j] + ' appears :',
                    name: 'listResult',
                    choices: resList
                }
            ])
        //... if he choose 'Save', start the save process
        }else{
            l = saveCheck.length
            i = 0
            //This loop check what item is to save and write it in the file that the user named above
            for(i=0;i<l;i++){
                if(saveCheck[i] == 1){
                    fs.appendFile('save/' + svName + '.txt', 'Comics about ' + resName[j] + ' :\n\n'+ resList.join('\n') + '\n\n', (err) => {
                        if (err) throw err
                    })
                    saveCheck[i] = 0
                }else if(saveCheck[i] == 2){
                    fs.appendFile('save/' + svName + '.txt', 'Series about ' + resName[j] + ' :\n\n'+ resList.join('\n') + '\n\n', (err) => {
                        if (err) throw err
                    })
                    saveCheck[i] = 0
                }else if(saveCheck[i] == 3){
                    fs.appendFile('save/' + svName + '.txt', 'Stories about ' + resName[j] + ' :\n\n'+ resList.join('\n') + '\n\n', (err) => {
                        if (err) throw err
                    })
                    saveCheck[i] = 0
                }else if(saveCheck[i] == 4){
                    fs.appendFile('save/' + svName + '.txt', 'Events about ' + resName[j] + ' :\n\n'+ resList.join('\n') + '\n\n', (err) => {
                        if (err) throw err
                    })
                    saveCheck[i] = 0
                }
            }
        }
    })
}

if(commander.menu){
    //Go to the main menu
    search()
}else if(commander.comics){
    //myhero -c [name] return a list of comics about a specific hero
    commanderCatalog(commander.comics, 'comics', 'Comics')
}else if(commander.series){
    //myhero -s [name] return a list of series about a specific hero
    commanderCatalog(commander.series, 'series', 'Series')
}else if(commander.stories){
    //myhero -t [name] return a list of stories about a specific hero
    commanderCatalog(commander.stories, 'stories', 'Stories')
}else if (commander.events) {
    //myhero -e [name] return a list of events about a specific hero
    commanderCatalog(commander.events, 'events', 'Events')
}else {
    commander.help()
}


/*TODO (ideas to improve)
- Give the total of items in the 'choice' list (ex : Comics (50))
- Order by
*/
