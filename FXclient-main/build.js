const beautify = require('js-beautify').js;
const fs = require('fs');

if (!fs.existsSync("./build")) fs.mkdirSync("./build");
fs.cpSync("./static/", "./build/", { recursive: true });
fs.cpSync("./assets/", "./build/assets/", { recursive: true });
fs.cpSync("./src/fx_core.js", "./build/fx_core.js");
fs.writeFileSync("./build/index.html", fs.readFileSync("./build/index.html").toString().replace(/buildTimestamp/g, Date.now()));
let script = fs.readFileSync('./game/latest.js', { encoding: 'utf8' }).replace("\n", "").trim();

const replaceOne = (expression, replaceValue) => {
    const result = matchOne(expression);
    // this (below) works correctly because expression.lastIndex gets reset above in matchOne when there is no match
    script = script.replace(expression, replaceValue);
    return result;
}
const matchOne = (expression) => {
	const result = expression.exec(script);
    if (result === null) throw new Error("no match for: ") + expression;
	if (expression.exec(script) !== null) throw new Error("more than one match for: " + expression);
	return result;
}
// https://stackoverflow.com/a/63838890
const escapeRegExp = (string) => string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');

//const dictionary = { __dictionaryVersion: '1.90.0   4 Feb 2024', playerId: 'bB', playerNames: 'hA', playerBalances: 'bC', playerTerritories: 'bj', gIsSingleplayer: 'fc', gIsTeamGame: 'cH' };
//if (!script.includes(`"${dictionary.__dictionaryVersion}"`)) throw new Error("Dictionary is outdated.");
let dictionary = {};

const matchDictionaryExpression = expression => {
	result = expression.exec(script);
	if (result === null) throw new Error("no match for ") + expression;
	if (expression.exec(script) !== null) throw new Error("more than one match for: ") + expression;
	for (let [key, value] of Object.entries(result.groups)) dictionary[key] = value;
}

// Return value example:
// When replaceRawCode or matchRawCode are called with "var1=var2+1;" as the code
// and this matches "a=b+1;", the returned value will be the object: { var1: "a", var2: "b" }
const replaceRawCode = (/** @type {string} */ raw, /** @type {string} */ result, nameMappings) => {
	const { expression, groups } = generateRegularExpression(raw, false, nameMappings);
	let replacementString = result.replaceAll("$", "$$").replace(/\w+/g, match => {
		return groups.hasOwnProperty(match) ? "$" + groups[match] : match;
	});
	//console.log(replacementString);
	const expressionMatchResult = replaceOne(expression, replacementString);
	return Object.fromEntries(Object.entries(groups).map(([identifier, groupNumber]) => [identifier, expressionMatchResult[groupNumber]]));
}
const matchRawCode = (/** @type {string} */ raw, nameMappings) => {
	const { expression, groups } = generateRegularExpression(raw, false, nameMappings);
	const expressionMatchResult = matchOne(expression);
	return Object.fromEntries(Object.entries(groups).map(([identifier, groupNumber]) => [identifier, expressionMatchResult[groupNumber]]));
}
const generateRegularExpression = (/** @type {string} */ code, /** @type {boolean} */ isForDictionary, nameMappings) => {
	const groups = {};
	let groupNumberCounter = 1;
	let raw = escapeRegExp(code).replace(isForDictionary ? /(?:@@)*(@?)(\w+)/g : /()(\w+)/g, (_match, modifier, word) => {
		// if a substitution string for the "word" is specified in the nameMappings, use it
		if (nameMappings && nameMappings.hasOwnProperty(word)) return nameMappings[word];
		// if the "word" is a number or is one of these specific words, ingore it
		if (/^\d/.test(word) || ["return", "this", "var", "function", "Math"].includes(word)) return word;
		else if (groups.hasOwnProperty(word)) return "\\" + groups[word]; // regex numeric reference to the group
		else {
			groups[word] = groupNumberCounter++;
			return modifier === "@" ? `(?<${word}>\\w+)` : "(\\w+)";
		}
	});
	let expression = new RegExp(isForDictionary ? raw.replaceAll("@@", "@") : raw, "g");
	return { expression, groups };
}

[
	///=(?<gIsSingleplayer>\w+)\?"Players":"Bots"/g,
	/,(?<gIsTeamGame>\w+)=\(\w+=\w+\)<7\|\|9===\w+,/g,
	/=function\((\w+),(\w+),\w+\){\1===(?<playerId>\w+)\?\w+\(175,\w+\.\w+\(18,\[(?<playerNames>\w+)\[\2\]\]\),1001,\2,\w+\(/g,
	// this one broke in 1.91.3 /{\w+===(?<playerId>\w+)\?\w+\(175," Message to "/g,
	/\w+\.\w+\((\w+)\)\?\w+\.\w+\(\1\)\?(\w+)=(\w+\.\w+)\(13,\[\2\]\):\(\w+=\w+\.\w+\(\1\),\2=\3\(14,\[(?<playerNames>\w+)\[(\w+)\],(\w+\.\w+\.\w+\()(?<playerBalances>\w+)\[\5\]\),\6(?<playerTerritories>\w+)\[\5\]\),\2\]\),\w+=!0\):\2=/g,
	// this one also broke in 1.91.3 /,\w+="Player: "\+(?<playerNames>\w+)\[\w+\],\w+=\(\w\+="   Balance: "\+\w+\.\w+\((?<playerBalances>\w+)\[\w+\]\)\)\+\("   Territory: "\+\w+\.\w+\((?<playerTerritories>\w+)\[\w+\]\)\)\+\("   Coords: "/g,
	///\((?<uiOffset>\w+)=Math\.floor\(\(\w+\?\.0114:\.01296\)\*\w+\)\)/g,
	/(function \w+\((\w+),(\w+),(\w+),(\w+),(\w+)\){\6\.fillText\((?<playerNames>\w+)\[\2\],\4,\5\)),(\2<(?<gHumans>\w+)&&2!==(?<playerStates>\w+)\[)/g,
	/,\w+=512,(?<gLobbyMaxJoin>\w+)=\w+,(?<gIsSingleplayer>\w+)&&\(\1=\w+\.\w+\(\)\),\w+=\1-\w+,\w+=0,/g
].forEach(matchDictionaryExpression);

const rawCodeSegments = [
	"[0]=aV.nU[70],a0T[1]=@gIsSingleplayer?aV.nU[71]:aV.nU[72],",
	"?(this.gB=Math.floor(.0536*aK.fw),g5=aK.g5-4*@uiSizes.@gap-this.gB):"
]

rawCodeSegments.forEach(code => {
	const { expression } = generateRegularExpression(code, true);
	//console.log(expression);
	matchDictionaryExpression(expression);
});

fs.writeFileSync("./build/fx_core.js", `const dictionary = ${JSON.stringify(dictionary)};\n` + fs.readFileSync("./build/fx_core.js").toString());

// Replace assets
const assets = require('./assets.js');
replaceOne(/(\(4,"crown",4,")[^"]+"\),/g, "$1" + assets.crownIcon + "\"),");
replaceOne(/(\(6,"territorial\.io",6,")[^"]+"\),/g, "$1" + assets.fxClientLogo + "\"),");

/*// Add FXClient menu item in "More" menu
// match },ug[0][5]={name:a79,id:5,mf:90,oU:0,e8:0},
replaceOne(/(},(\w+\[0\])\[\d+\]={(\w+):\w+,(\w+):\d+,(\w+):90,(\w+):0,(\w+):0},)/g,
    '$1$2.push({$3:"FX Client v" + fx_version + " " + fx_update, $4: 20, $5: 0, $6: 0, $7: 70}),');
// Do not display hover effect on the last 2 items (territorial.io version and FX Client version) instead of only the last item
// match 0 === a9P ? ug[a9P].length - 1 : ug[a9P].length : 1,
replaceOne(/(0===(\w+)\?(\w+)\[\2\]\.length)-1:(\3\[\2\]\.length:1,)/g, "$1 - 2 : $4");*/
// Add FX Client version info to the game version window
//replaceRawCode(`ar.aAx("MenuGameVersion")||ar.aAz(new aB3("ℹ️ "+aV.nU[84],gameVersion+"<br><a href='"`,
replaceRawCode(`ar.oa(4,1,new s8("ℹ️ "+Translations.txt[84],gameVersion+"<br><a href='"+ah.aC5+"' target='_blank'>"+ah.aC5+"</a>",`,
`ar.oa(4,1,new s8("ℹ️ "+Translations.txt[84],gameVersion+"<br><a href='"+ah.aC5+"' target='_blank'>"+ah.aC5+"</a>"
+ "<br><br><b>" + "FX Client v" + fx_version + " " + fx_update + "<br><a href='https://discord.gg/dyxcwdNKwK' target='_blank'>FX Client Discord server</a>"
+ "<br><a href='https://github.com/fxclient/FXclient' target='_blank'>Github repository</a></b>",`);

// Max size for custom maps: from 4096x4096 to 8192x8192
// TODO: test this; it might cause issues with new boat mechanics?

{ // Add Troop Density and Maximum Troops in side panel
	/*const { groups: { valuesArray } } = replaceOne(/(,(?<labelsArray>\w+)\[\d\]="Interest",\2\[\d\]="Income",\2\[\d\]="Time"),(\w+=\w+-\w+\(\w+,100\),\((?<valuesArray>\w+)=new Array\(\2\.length\)\)\[0\]=\w+)/g,
		'$1, $<labelsArray>.push("Max Troops", "Density"), $3'); // add labels*/
	const { valuesArray } = replaceRawCode(`,labels[5]=aV.nU[76],labels[6]=aV.nU[77],labels[7]=aV.nU[78],a0Z=tn-eT(tn,100),(valuesArray=new Array(labels.length))[0]=io?`,
	`,labels[5]=aV.nU[76],labels[6]=aV.nU[77],labels[7]=aV.nU[78],
		labels.push("Max Troops", "Density"), // add labels
		a0Z=tn-eT(tn,100),(valuesArray=new Array(labels.length))[0]=io?`);
	replaceOne(new RegExp(/(:(?<valueIndex>\w+)<7\?\w+\.\w+\.\w+\(valuesArray\[\2\]\)):(\w+\.\w+\(valuesArray\[7\]\))}/
		.source.replace(/valuesArray/g, valuesArray), "g"),
		'$1 : $<valueIndex> === 7 ? $3 '
		+ `: $<valueIndex> === 8 ? utils.getMaxTroops(${dictionary.playerTerritories}, ${dictionary.playerId}) `
		+ `: utils.getDensity(${dictionary.playerId}) }`);
	// increase the size of the side panel by 25% to make the text easier to read
	replaceOne(/(this\.\w+=Math\.floor\(\(\w+\.\w+\.\w+\(\)\?\.1646:\.126\))\*(\w+\.\w+\),)/g, "$1 * 1.25 * $2");
}

// Increment win counter on wins
/*replaceOne(/(=function\((\w+)\){)([^}]+),((\w+\(0),\w+<100\?(\w+\.\w+)\(11,(\[\w+\[\w+\]\])\):\6\(12,\7\),(3,\2,[^()]+?\))),(?<end>[^}]+},)/g,
`$1 if (${dictionary.playerId} === $2) wins_counter++, window.localStorage.setItem("fx_winCount", wins_counter); ` +
`$3, $4, $5, "Your Current Win Count is Now " + wins_counter, $8, $<end>`);*/
replaceRawCode(`=function(rC){n.hQ(rC,2),vm(0,h2<100?aV.s9(4,[jm[rC]]):aV.s9(12,[jm[rC]]),3,rC,aZ.gG,aZ.ka,-1,!0),`,
	`=function(rC){
		if (${dictionary.playerId} === rC && !${dictionary.gIsSingleplayer})
			wins_counter++, window.localStorage.setItem("fx_winCount", wins_counter),
			vm(0,"Your Win Count is now " + wins_counter,3,rC,aZ.gG,aZ.ka,-1,!0);
	n.hQ(rC,2),vm(0,h2<100?aV.s9(4,[jm[rC]]):aV.s9(12,[jm[rC]]),3,rC,aZ.gG,aZ.ka,-1,!0),`);


{ // Add settings button and win count
// render gear icon and win count
/*// cV.textAlign=cX,cV.textBaseline=cW,a03(a9Y.gb,a9Y.gc,a9Y.m5,a9Y.tD,ug[a9P][0].mf,ug[a9P][0].oU,ug[a9P][0].e8,0===yk,ug[a9P][0].name),a9O))
// l(A.f3, A.f4, A.hw, A.nI, z[0].f7, z[0].mx, z[0].cm, 0 === t, z[0].name, .6);
// cH.drawImage(settingsGearIcon,A.f3-A.hw/2,A.f4,A.nI,A.nI);
// cH.font = bt + Math.floor(A.nI * 0.4) + bu;
// cH.fillText("Win count: " + wins_counter, Math.floor(A.f3 + A.hw / 2), Math.floor((A.f4 + A.nI / 2) * 2.1));
const { groups } = replaceOne(/((?<canvas>\w+)\.textAlign=\w+,\2\.textBaseline=\w+,\w+\((?<x>(?<coords>\w+).\w+),(?<y>\4.\w+),(?<w>\4.\w+),(?<h>\4.\w+),[^)]+\)),(?<end>(?<isMenuOpened>\w+)\)\))/g, '$1, ' +
'$<canvas>.imageSmoothingEnabled = true, ' +
'$<canvas>.drawImage(settingsGearIcon, $<x>-$<w>/2, $<y>, $<h>, $<h>), ' +
'$<canvas>.imageSmoothingEnabled = false, ' +
'$<canvas>.font = "bold " + Math.floor($<h> * 0.4) + "px " + settings.fontName, ' +
'(settings.displayWinCounter && !$<isMenuOpened> && $<canvas>.fillText("Win count: " + wins_counter, Math.floor($<x> + $<w> / 2), Math.floor(($<y> + $<h> / 2) * 2.1))), ' +
'$<end>');*/
replaceRawCode(`,fy=aV.nU[80],fontSize=.65*height,canvas.font=aY.g0.g1(1,fontSize),canvas.fillStyle="rgba("+gR+","+tD+","+hj+",0.6)",canvas.fillRect(x,y,width,height),`,
`,fy=aV.nU[80],fontSize=.65*height,
canvas.imageSmoothingEnabled = true,
canvas.drawImage(settingsGearIcon, x - width / 2, y, height, height),
canvas.imageSmoothingEnabled = false,
(settings.displayWinCounter && (
	canvas.font = aY.g0.g1(1, Math.floor(height * 0.4)),
	canvas.fillStyle = "#ffffff",
	canvas.fillText("Win count: " + wins_counter, Math.floor(x + width / 2), Math.floor((y + height / 2) * 2))
)),
canvas.font=aY.g0.g1(1,fontSize),canvas.fillStyle="rgba("+gR+","+tD+","+hj+",0.6)",canvas.fillRect(x,y,width,height),`);

// handle settings button click
/*replaceOne(/(this\.\w+=function\((?<mouseX>\w+),(?<mouseY>\w+)\){[^}]+?)if\((?<coordsGet>\w+=\w+\(\)),(?<isMenuOpened>\w+)\)(?<end>{for\([^}]+"Lobby ")/g,
'$1 $<coordsGet>; ' +
`var gearIconX = ${groups.x}-${groups.w}/2; ` +
// if (y > (C.f3-C.hw/2) && y < ((C.f3-C.hw/2)+C.nI) && A > C.f4 && A < (C.f4 + C.nI)) WindowManager.openWindow("settings");
`if ($<mouseX> > gearIconX && $<mouseX> < (gearIconX+${groups.h}) && $<mouseY> > ${groups.y} && $<mouseY> < (${groups.y}+${groups.h})) return WindowManager.openWindow("settings"); ` +
'if ($<isMenuOpened>) $<end>');*/
replaceRawCode(`(q6=Math.floor((b7.cv.fv()?.145:.09)*aK.fw),gap=Math.floor(.065*(b7.cv.fv()?.53:.36)*aK.fw),gap=aK.g5-q6-gap,jd=b0.gap,q6=Math.floor(.35*q6),gap<=mouseX&&mouseY<jd+q6&&ar.v2(1))`,
`(q6=Math.floor((b7.cv.fv()?.145:.09)*aK.fw),gap=Math.floor(.065*(b7.cv.fv()?.53:.36)*aK.fw),gap=aK.g5-q6-gap,jd=b0.gap,q6=Math.floor(.35*q6),
(gap <= mouseX && mouseY < jd + q6 && (ar.v2(1), true)) || (mouseX >= gap - q6 / 0.7 && mouseY < jd + q6 && WindowManager.openWindow("settings"))
)`);
}

{ // Keybinds
	// match required variables
	const { 0: match, groups: { attackBarObject, setRelative } } = matchOne(/:"."===(\w+\.key)\?(?<attackBarObject>\w+)\.(?<setRelative>\w+)\(31\/32\):"."===\1\?\2\.\3\(32\/31\):/g,);
	// create a setAbsolutePercentage function on the attack percentage bar object,
	// and also register the keybind handler functions
	replaceOne(/}(function \w+\((\w+)\){return!\(1<\2&&1===(?<attackPercentage>\w+)\|\|\(1<\2&&\2\*\3-\3<1\/1024\?\2=\(\3\+1\/1024\)\/\3:\2<1)/g,
	"} this.setAbsolutePercentage = function(newPercentage) { $<attackPercentage> = newPercentage; }; "
		+ "keybindFunctions.setAbsolute = this.setAbsolutePercentage; "
		+ `keybindFunctions.setRelative = (arg1) => ${attackBarObject}.${setRelative}(arg1); $1`);
	// insert keybind handling code into the keyDown handler function
	replaceOne(new RegExp(/(function \w+\((?<event>\w+)\){)([^}]+matched)/g.source.replace(/matched/g, escapeRegExp(match)), "g"),
	"$1 if (keybindHandler($<event>.key)) return; $3");
}

// Set the default font to Trebuchet MS
script = script.replace(/sans-serif"/g, 'Trebuchet MS"');

// Realistic bot names setting
// matches c4[i] = c4[i].replace(a6U[dx], a6V[dx])
replaceOne(/(((\w+)\[\w+\])=\2\.replace\(\w+(\[\w+\]),\w+\4\))/g, "$1; if (settings.realisticNames) $3 = realisticNames;")

// Hide all links in main menu depending on settings
//replaceOne(/(this\.\w+=function\(\){)((\w+\.\w+)\[2\]=\3\[3\]=\3\[4\]=(?<linksHidden>!this\.\w+\.\w+),)/g,
//"$1 if (settings.hideAllLinks) $3[0] = $3[1] = $<linksHidden>; else $3[0] = $3[1] = true; $2")

// Make the main canvas context have an alpha channel if a custom background is being used
replaceOne(/(document\.getElementById\("canvasA"\),\(\w+=\w+\.getContext\("2d",){alpha:!1}/g, "$1 {alpha: makeMainMenuTransparent}")
// Clear canvas background if a custom background is being used
replaceOne(/(this\.\w+=function\(\){var (\w+),(\w+);)(\w+\.\w+\?\([^()]+setTransform\(\3=\2<\3\?\3:\2,0,0,\3,(?:Math\.floor\(\([^)]+\)\/2\)[,)]){2},(?:[^)]+\),){2}[^)]+\):(?<canvas>\w+)\.fillStyle=\w+\.\w+,\5\.fillRect\((?<wholeCanvas>0,0,\w+\.\w+,\w+\.\w+)\)}})/g,
	'$1 if (makeMainMenuTransparent) $<canvas>.clearRect($<wholeCanvas>); else $4')

// Track donations
replaceOne(/(this\.\w+=function\((\w+),(\w+)\)\{)(\2===\w+&&\(\w+\.\w+\((\w+\.\w+)\[0\],\5\[1\],\3\),this\.(\w+)\[12\]\+=\5\[1\],this\.\6\[16\]\+=\5\[0\]\),\3===\w+&&\()/g,
"$1 donationsTracker.logDonation($2, $3, $5[0]); $4")

// Display donations for a player when clicking on them in the leaderboard
// match , 0 !== dG[x]) && fq.hB(x, 800, false, 0),
replaceOne(/,(0!==\w+\[(\w+)\]\)&&\w+\.\w+\(\2,800,!1,0\),)/g,
	`, ${dictionary.gIsTeamGame} && donationsTracker.displayHistory($2, ${dictionary.playerNames}, ${dictionary.gIsSingleplayer}), $1`);

// Reset donation history when a new game is started
replaceOne(new RegExp(`,${dictionary.playerBalances}=new Uint32Array\\(\\w+\\),`, "g"), "$& donationsTracker.reset(), ");

{ // Player list
	// Draw player list button
	const uiOffset = dictionary.uiSizes + "." + dictionary.gap;
	const { groups: { drawFunction, topBarHeight } } = replaceOne(/(=1;function (?<drawFunction>\w+)\(\){[^}]+?(?<canvas>\w+)\.fillRect\(0,(?<topBarHeight>\w+),\w+,1\),(?:\3\.fillRect\([^()]+\),)+\3\.font=\w+,(\w+\.\w+)\.textBaseline\(\3,1\),\5\.textAlign\(\3,1\),\3\.fillText\(\w+\.\w+\[65\],Math\.floor\()(\w+)\/2\),(Math\.floor\(\w+\+\w+\/2\)\));/g,
	"$1($6 + $<topBarHeight> - 22) / 2), $7; playerList.drawButton($<canvas>, 12, 12, $<topBarHeight> - 22);");
	const buttonBoundsCheck = `utils.isPointInRectangle($<x>, $<y>, ${uiOffset} + 12, ${uiOffset} + 12, ${topBarHeight} - 22, ${topBarHeight} - 22)`
	// Handle player list button mouseDown
	replaceOne(/(this\.\w+=function\((?<x>\w+),(?<y>\w+)\){return!!\w+\(\2,\3\))&&(\(\w+=\w+\.\w+,)/g,
	`$1 && (${buttonBoundsCheck} && playerList.display(${dictionary.playerNames}), true) && $4`);
	// Handle player list button hover
	replaceOne(/(this\.\w+=function\((?<x>\w+),(?<y>\w+)\){)(var \w+,\w+=\w+\(\3\);return \w+\?\(\w+=(\w+),\(\5=\w+\(0,\5\+=(?:[^}]+,(?<setRepaintNeeded>\w+\.\w+=!0)){2})/g,
	`$1 if (${buttonBoundsCheck}) { playerList.hoveringOverButton === false && (playerList.hoveringOverButton = true, ${drawFunction}(), $<setRepaintNeeded>); } `
	+ ` else { playerList.hoveringOverButton === true && (playerList.hoveringOverButton = false, ${drawFunction}(), $<setRepaintNeeded>); } $4`);
}

{ // Display density of other players
	// Applies when the "Reverse Name/Balance" setting is off
	const { groups: { settingsSwitchNameAndBalance } } = replaceOne(/(,(?<settingsSwitchNameAndBalance>\w+\.\w+\.\w+\[7\]\.\w+)\?(?<nameDrawingFunction>\w+)\(\w+,\w+,(?<x>\w+),(?<y>\w+)\+\.78\*(?<fontSize>\w+),(?<canvas>\w+)\)):(\7\.fillText\(\w+\.\w+\.\w+\(\w+\[(\w+)\]\),\4,\5\+\.78\*\6\))\)\)/g,
	`$1 : ($8, settings.showPlayerDensity && (settings.coloredDensity && ($<canvas>.fillStyle = utils.textStyleBasedOnDensity($9)), $<canvas>.fillText(utils.getDensity($9), $<x>, $<y> + $<fontSize> * 1.5)) ) ) )`);
	// Applies when the "Reverse Name/Balance" setting is on (default)
	replaceOne(/(function \w+\((\w+),(?<fontSize>\w+),(?<x>\w+),(?<y>\w+),(?<canvas>\w+)\){)(\6\.fillText\((?<playerNames>\w+)\[\2\],\4,\5\)),(\2<(?<gHumans>\w+)&&2!==(?<playerStates>\w+)\[[^}]+)}/g,
	`$1 var ___id = $2; $7, $9; ${settingsSwitchNameAndBalance} && settings.showPlayerDensity && (settings.coloredDensity && ($<canvas>.fillStyle = utils.textStyleBasedOnDensity(___id)), $<canvas>.fillText(utils.getDensity(___id), $<x>, $<y> + $<fontSize>)); }`);
}

// Disable built-in Territorial.io error reporting
replaceOne(/window\.addEventListener\("error",function (\w+)\((\w+)\){/g,
	'$& window.removeEventListener("error", $1); return alert("Error:\\n" + $2.filename + " " + $2.lineno + " " + $2.colno + " " + $2.message);');

console.log('Removing ads...');
// Remove ads
script = script.replace('//api.adinplay.com/libs/aiptag/pub/TRT/territorial.io/tag.min.js','');

console.log("Formatting code...");

exposeVarsToGlobalScope = true;

if (exposeVarsToGlobalScope && script.startsWith("\"use strict\";    (function () {") && script.endsWith("})();"))
	script = script.slice("\"use strict\";    (function () {".length, -"})();".length);
if (exposeVarsToGlobalScope && script.startsWith("(function () {") && script.endsWith("})();"))
	script = script.slice("(function () {".length, -"})();".length);

script = beautify(script, {
	"indent_size": "1",
	"indent_char": "\t",
	"max_preserve_newlines": "5",
	"preserve_newlines": true,
	"keep_array_indentation": false,
	"break_chained_methods": false,
	"indent_scripts": "normal",
	"brace_style": "collapse",
	//"brace_style": "expand",
	"space_before_conditional": true,
	"unescape_strings": false,
	"jslint_happy": false,
	"end_with_newline": false,
	"wrap_line_length": "250",
	"indent_inner_html": false,
	"comma_first": false,
	"e4x": false,
	"indent_empty_lines": false
});

fs.writeFileSync("./build/game.js", script);
console.log("Wrote ./build/game.js");
console.log("Build done");