// VARIABLE & FUNCTION DECLARATIONS -- DO NOT ALTER!!
var PowerCardScript = PowerCardScript || {};
var getBrightness = getBrightness || {};
var hexDec = hexDec || {};
PowerCardScript.version = "2.1";

// USER CONFIGUATION
var POWERCARD_ROUNDED_CORNERS = true;
var POWERCARD_ROUNDED_INLINE_ROLLS = true;
var POWERCARD_BORDER_SIZE = 1;
var POWERCARD_BORDER_COLOR = "#000";
var POWERCARD_USE_PLAYER_COLOR = false;

on("chat:message", function (msg) {
    // Exit if not an api command
    if (msg.type != "api") return;

    // Get the API Chat Command
    msg.who = msg.who.replace(" (GM)", "");
	msg.content = msg.content.replace("(GM) ", "");
	var command = msg.content.split(" ", 1);
    if(command == "!power") {
        log("-- Start !power --");
        PowerCardScript.Process(msg);
        log("-- End !power --");
    }
});

PowerCardScript.Process = function(msg){
    // DEFINE VARIABLES
	var n = msg.content.split(" --");
	var PowerCard = {};
	var DisplayCard = "";
	var NumberOfAttacks = 1;
	var NumberOfDmgRolls = 1;
	var NumberOfRolls = 1;
	var Tag = "";
	var Content = "";
	
	// CREATE POWERCARD OBJECT ARRAY
    log("--- Getting Tag/Content ---")
    n.shift(); // remove first value;
    n.forEach(function(token){
        log(token);
    	Tag = token.substring(0, token.indexOf("|"));
    	Content = token.substring(token.indexOf("|") + 1);
		if (Tag.substring(0, 6).toLowerCase() == "attack") {
			var attacks = parseInt(Tag.substring(6));
            if(attacks && attacks > NumberOfAttacks) {
                NumberOfAttacks = attacks;
                Tag = "attack";
            }
		}
		else if (Tag.substring(0, 6).toLowerCase() == "damage") {
    		var dmgs = parseInt(Tag.substring(6));
            if(dmgs && dmgs > NumberOfDmgRolls) {
                NumberOfDmgRolls = dmgs;
                Tag = "damage";
            }
		}
        else if (Tag.substring(0, 9).toLowerCase() == "multiroll") {
        	var mrolls = parseInt(Tag.substring(9));
            if(mrolls && mrolls > NumberOfRolls) {
                NumberOfRolls = mrolls;
                Tag = "multiroll";
            }
        }
		PowerCard[Tag] = Content;
        log("Tag: " + Tag + " = " + Content);
    });
    log("NumberOfAttacks: " + NumberOfAttacks);
    log("NumberOfDmgRolls: " + NumberOfDmgRolls);
    log("NumberOfRolls: " + NumberOfRolls);
	
	// ERROR CATCH FOR EMPTY EMOTE
	if (PowerCard.emote == "") PowerCard.emote = '" "';
	
	// CREATE TITLE STYLE
	var TitleStyle = " font-family: Georgia; font-size: large; font-weight: normal; text-align: center; vertical-align: middle; padding: 5px 0px; margin-top: 0.2em; border: " + POWERCARD_BORDER_SIZE + "px solid " + POWERCARD_BORDER_COLOR + ";";
	
	// ROUNDED CORNERS ON TOP OF POWER CARD
	TitleStyle += (POWERCARD_ROUNDED_CORNERS) ? " border-radius: 10px 10px 0px 0px;" : "";
	
	// LIST OF PRE-SET TITLE TEXT & BACKGROUND COLORS FOR D&D 4E
	var AtWill = " color: #FFF; background-color: #040;";
	var Encounter = " color: #FFF; background-color: #400;";
	var Daily = " color: #FFF; background-color: #444;";
	var Item = " color: #FFF; background-color: #e58900;";
	var Recharge = " color: #FFF; background-color: #004;";
	
    log("--- Processing Header Tags ---")
	// CHECK FOR PRESET TITLE COLORS
	if (!POWERCARD_USE_PLAYER_COLOR) {
		if (PowerCard.usage !== undefined && PowerCard.txcolor === undefined && PowerCard.bgcolor === undefined) {
			// PRESET TITLE COLORS
			TitleStyle += AtWill;
			if (PowerCard.usage.toLowerCase().indexOf("encounter") != -1) TitleStyle += Encounter;
			if (PowerCard.usage.toLowerCase().indexOf("daily") != -1) TitleStyle += Daily;
			if (PowerCard.usage.toLowerCase().indexOf("item") != -1) TitleStyle += Item;
			if (PowerCard.usage.toLowerCase().indexOf("recharge") != -1) TitleStyle += Recharge;
		} else {
			// CUSTOM TITLECARD TEXT & BACKGROUND COLORS
			TitleStyle += (PowerCard.txcolor !== undefined) ? " color: " + PowerCard.txcolor + ";" : " color: #FFF;";
			TitleStyle += (PowerCard.bgcolor !== undefined) ? " background-color: " + PowerCard.bgcolor + ";" : " background-color: #040;";
		}
	} else {
		// SET TITLE BGCOLOR TO PLAYER COLOR --- OVERRIDES ALL OTHER COLOR OPTIONS ---
		var PlayerBGColor = getObj("player", msg.playerid).get("color");
		var PlayerTXColor = (getBrightness(PlayerBGColor) < 50) ? "#FFF" : "#000";
		TitleStyle += " color: " + PlayerTXColor + "; background-color: " + PlayerBGColor + ";";
	}
	
	// DEFINE .leftsub and .rightsub
	if (PowerCard.leftsub === undefined) PowerCard.leftsub = (PowerCard.usage !== undefined) ? PowerCard.usage : "";
	if (PowerCard.rightsub === undefined) PowerCard.rightsub = (PowerCard.action !== undefined) ? PowerCard.action : "";
	var PowerCardDiamond = (PowerCard.leftsub == "" || PowerCard.rightsub == "") ? "" : " ? ";
	
	// BEGIN DISPLAYCARD CREATION
    PowerCard.title = PowerCard.title ? PowerCard.title.split("|").join("&" + "#013;") : PowerCard.title;
    DisplayCard += "<div style='" + TitleStyle + "' title='" + PowerCard.title + "'>" + PowerCard.name;
	DisplayCard += (PowerCard.leftsub !== "" || PowerCard.rightsub !== "") ? "<br><span style='font-family: Tahoma; font-size: small; font-weight: normal;'>" + PowerCard.leftsub + PowerCardDiamond + PowerCard.rightsub + "</span></div>" : "</div>";
	
	// ROW STYLE VARIABLES
	var OddRow = " background-color: #CEC7B6; color: #000;";
	var EvenRow = " background-color: #B6AB91; color: #000;";
	var RowStyle = " padding: 5px; border-left: " + POWERCARD_BORDER_SIZE + "px solid " + POWERCARD_BORDER_COLOR + "; border-right: " + POWERCARD_BORDER_SIZE + "px solid " + POWERCARD_BORDER_COLOR + "; border-radius: 0px;";
	var RowBackground = OddRow;
	var RowNumber = 1;
	var Indent = 0;
	var KeyCount = 0;
	
    log("--- Processing Display Tags (Key Loop)---")
	// KEY LOOP
	var Keys = Object.keys(PowerCard);
	var ReservedTags = "attack, damage, multiroll, lb";
	var IgnoredTags = "format, emote, name, usage, action, defense, txcolor, bgcolor, leftsub, rightsub, ddn, desc, crit, title, whisper";
    Keys.forEach(function(Tag){
        log("Tag: " +Tag);
    	Content = PowerCard[Tag];
		if (Tag.charAt(0) === "^") {
			Indent = (parseInt(Tag.charAt(1)) > 0) ? Tag.charAt(1) : 1;
			Tag = (parseInt(Tag.charAt(1)) > 0) ? Tag.substring(2) : Tag.substring(1);
			RowStyle += " padding-left: " + (Indent * 1.5) + "em;";
		}
		
		// CHECK FOR RESERVED & IGNORED TAGS
		if (ReservedTags.indexOf(Tag) != -1) {
			// ATTACK ROLLS
    		if (Tag.toLowerCase() == "attack") {
                log("-- Processing attack Tag --")
                for(var AttackCount = 0; AttackCount < NumberOfAttacks; AttackCount++){
        			RowBackground = (RowNumber % 2 == 1) ? OddRow : EvenRow;
    				RowNumber += 1;
                    switch (PowerCard.format) {
                        case "dnd4e": {
                            if (AttackCount == 0) {
                                PowerCard[Tag] = PowerCard[Tag].replace("]]", "]] vs " + PowerCard.defense + " ");
                                DisplayCard += "<div style='" + RowStyle + RowBackground + "'>" + PowerCard[Tag] + "</div>";
                            }
                            else DisplayCard += "<div style='" + RowStyle + RowBackground + "'>$[a" + AttackCount + "]</div>";
                            break;
                        }
                        case "ddn": {
                            DisplayCard += "<div style='" + RowStyle + RowBackground + "'>[ " + PowerCard[Tag] + " ] vs Armor Class</div>";
                            break;
                        }
                        default:
                            if (AttackCount == 0) DisplayCard += "<div style='" + RowStyle + RowBackground + "'>" + PowerCard[Tag] + "</div>";
                            else DisplayCard += "<div style='" + RowStyle + RowBackground + "'>$[a" + AttackCount + "]</div>";
                    }
                };
                log(DisplayCard);
    		}
			
			// DAMAGE ROLLS
			if (Tag.toLowerCase() == "damage") {
                log("-- Processing damage Tag --")
				for (var DamageCount = 0; DamageCount < NumberOfDmgRolls; DamageCount++) {
					RowBackground = (RowNumber % 2 == 1) ? OddRow : EvenRow;
					RowNumber += 1;
                    if (DamageCount == 0) DisplayCard += "<div style='" + RowStyle + RowBackground + "'>" + PowerCard[Tag] + "</div>";
                    else DisplayCard += "<div style='" + RowStyle + RowBackground + "'>$[d" + DamageCount + "]</div>";
				}
                log(DisplayCard);
			}
            
            // MULTIROLLS
            if (Tag.toLowerCase() == "multiroll") {
                for (var MultiRoll = 0; MultiRoll < NumberOfRolls; MultiRoll++) {
                    RowBackground = (RowNumber % 2 == 1) ? OddRow : EvenRow;
					RowNumber += 1;
                    if (MultiRoll == 0) DisplayCard += "<div style='" + RowStyle + RowBackground + "'>" + PowerCard[Tag] + "</div>";
                    else DisplayCard += "<div style='" + RowStyle + RowBackground + "'>$[m" + MultiRoll + "]</div>";
                }
            }
			
			// LINE BREAK
			if (Tag.toLowerCase() == "lb") {
				DisplayCard += "<div style='" + RowStyle + RowBackground + "'> </div>";
				DisplayCard += "<div style='" + RowStyle + RowBackground + "'>" + PowerCard.lb + "</div>";
			}
		} else if (IgnoredTags.indexOf(Tag.toLowerCase()) != -1) {
			// Do nothing
		} else {
			RowBackground = (RowNumber % 2 == 1) ? OddRow : EvenRow;
			RowNumber += 1;
			DisplayCard += "<div style='" + RowStyle + RowBackground + "'><b>" + Tag + ":</b> " + Content + "</div>";
		}
		KeyCount++;
	});
	
	// ADD ROUNDED CORNERS & BORDER TO BOTTOM OF POWER CARD
	if (POWERCARD_ROUNDED_CORNERS && KeyCount == (Keys.length)) DisplayCard = DisplayCard.replace(/border-radius: 0px;(?!.*border-radius: 0px;)/g, "border-radius: 0px 0px 10px 10px; border-bottom: " + POWERCARD_BORDER_SIZE + "px solid " + POWERCARD_BORDER_COLOR + ";");
	if (!POWERCARD_ROUNDED_CORNERS && POWERCARD_BORDER_SIZE) DisplayCard = DisplayCard.replace(/border-radius: 0px;(?!.*border-radius: 0px;)/g, "border-bottom: " + POWERCARD_BORDER_SIZE + "px solid " + POWERCARD_BORDER_COLOR + ";");
	
	// INLINE ROLLS REPLACEMENT
	var Count = 0;
	if (msg.inlinerolls !== undefined) {
		log("-- Processing Inlinerolls")
		// Process inline rolls (multirolls are processed later)
		for(var i = 0; i < msg.inlinerolls.length; i++){
			var inlinerollValue = buildinline(msg.inlinerolls[i], PowerCard.crit);
			DisplayCard = DisplayCard.replace("$[[" + i + "]]", inlinerollValue);
		}
		
		log("-- Processing Multirolling --");
		// Multirolling
		var content = PowerCard["attack"];
		var idx = content ? content.substring(content.indexOf("$[[") + 3, content.indexOf("]]")) : false;
		var exp = idx && msg.inlinerolls[idx] ? msg.inlinerolls[idx].expression : undefined;
		var attExp = buildExpression(NumberOfAttacks, "a", exp);

		content = PowerCard["damage"];
		idx = content ? content.substring(content.indexOf("$[[") + 3, content.indexOf("]]")) : false;
		exp = idx && msg.inlinerolls[idx] ? msg.inlinerolls[idx].expression : undefined;
		var dmgExp = buildExpression(NumberOfDmgRolls, "d", exp);

		content = PowerCard["multiroll"];
		idx = content ? content.substring(content.indexOf("$[[") + 3, content.indexOf("]]")) : false;
		exp = idx && msg.inlinerolls[idx] ? msg.inlinerolls[idx].expression : undefined;
		var mltExp = buildExpression(NumberOfRolls, "m", exp);
		// process multirolling results
		// All multirolling is done via 1 sendChat callback
		// rollExp contains all multirolling inline expressions
		var rollExp = attExp + ";" + dmgExp + ";" + mltExp;
		sendChat("", rollExp, function(m){
			log("processing attacks");
			for(var i = 1; i < NumberOfAttacks; i++){
				var inlinerollValue = buildinline(m[0].inlinerolls[i], PowerCard.crit);
				DisplayCard = DisplayCard.replace("$[a" + i + "]", inlinerollValue);
			}
			log("processing damage");
			var dIndex = 1;
			for(var i = NumberOfAttacks; i < NumberOfAttacks+NumberOfDmgRolls-1 ; i++){
				var inlinerollValue = buildinline(m[0].inlinerolls[i], PowerCard.crit);
				DisplayCard = DisplayCard.replace("$[d" + dIndex++ + "]", inlinerollValue);
			}
			log("processing multiroll");
			var mIndex = 1;
			for(var i = NumberOfAttacks+NumberOfDmgRolls-1; i < NumberOfAttacks+NumberOfDmgRolls+NumberOfRolls-2 ; i++){
				var inlinerollValue = buildinline(m[0].inlinerolls[i], PowerCard.crit);
				DisplayCard = DisplayCard.replace("$[m" + mIndex++ + "]", inlinerollValue);
			}
			log("-- finished multi-rolling --");
			// Send results to chat
			if (DisplayCard.search(/\$\[\[\d+\]\]/g) == -1) {
				//log("displaying card");
				// SEND OUTPUT TO CHAT
				if (PowerCard.whisper !== "no" && PowerCard.whisper !== undefined) {
					sendChat("Power Card Script", "/w GM " + DisplayCard);
				} else {
					if (PowerCard.emote !== undefined) sendChat(msg.who, "/emas " + PowerCard.emote);
					if (PowerCard.desc !== undefined) sendChat("", "/desc ");
					sendChat("", "/direct " + DisplayCard);
				}
			}
			else {
				log("---- Error occured --")
				log(DisplayCard);
				sendChat("", "/direct " + DisplayCard);
				sendChat("PowerCardScript", "Error occured");
			}
		});
	} else {
		// NO INLINE ROLLS
		if (PowerCard.whisper !== "no" && PowerCard.whisper !== undefined) {
			sendChat("Power Card Script", "/w GM " + DisplayCard);
		} else {
			if (PowerCard.emote !== undefined) sendChat(msg.who, "/emas " + PowerCard.emote);
			if (PowerCard.desc !== undefined) sendChat("", "/desc ");
			sendChat("", "/direct " + DisplayCard);
		}
	}
    //log(DisplayCard);
}

function buildinline(inlineroll, crit){
    log("-- Processing inlineroll (" + (crit || 0) + ") --");
    log(inlineroll);
    var InlineBorderRadius = (POWERCARD_ROUNDED_INLINE_ROLLS) ? 5 : 0;
    var values = [];
    var critRoll = false;
    var failRoll = false;
//    log(inlineroll);
    inlineroll.results.rolls.forEach(function(roll){
        var result = processRoll(roll, crit, critRoll, failRoll);
        values.push(result.value);
        log("critRoll: " + result.critRoll);
        log("failRoll: " + result.failRoll);
        critRoll = result.critRoll;
        failRoll = result.failRoll;
    });
//    log(values.join(""));
//    log("Crit:" + critRoll);
//    log("Fail:" + failRoll);
    var rollOut = '<span style="text-align: center; vertical-align: text-middle; display: inline-block; min-width: 1.75em; border-radius: ' + InlineBorderRadius + 'px; padding: 2px 0px 0px 0px;" title="Rolling ' + inlineroll.expression + ' = ' + values.join("");
    rollOut += '" class="a inlinerollresult showtip tipsy-n';
    rollOut += (critRoll && failRoll ? ' importantroll' : (critRoll ? ' fullcrit' : (failRoll ? ' fullfail' : ''))) + '">' + inlineroll.results.total + '</span>';
    return rollOut;
};

function buildExpression(numRolls, tag, expression){
    var rolls = [];
    for(var i = 1; i < numRolls; i++){
        rolls.push("[[" + expression +"]]");
    };
    return tag + ":" + rolls.join(" ");
}


function processRoll(roll, crit, critRoll, failRoll){
    if(roll.type === "M") return {value: roll.expr, critRoll:critRoll, failRoll:failRoll};
    else if(roll.type === "R"){
        log("Procing Roll");
        var rollValues = [];
        roll.results.forEach(function(result){
            if(crit && result.v >= crit) critRoll = true;
            else if(result.v === roll.sides) critRoll = true;
            else if(result.v === 1) failRoll = true;
            log("res: " + result.v + " sides: " + roll.sides + " crit/fail: " + critRoll + "/" + failRoll);
            rollValues.push(result.v);
        });
        return {value: "(" + rollValues.join("+") + ")", critRoll:critRoll, failRoll:failRoll};
    }
    else if(roll.type === "G"){
        log("Procing Group Rolls")
        var grollVal = [];
        log(roll);
        roll.rolls.forEach(function(groll){
            groll.forEach(function(groll2){
                log(groll);
                var result = processRoll(groll2, crit);
                grollVal.push(result.value);
                critRoll = critRoll || result.critRoll;
                failRoll = failRoll || result.failRoll;
            })
        });
        return {value: "{" + grollVal.join("") + "}", critRoll:critRoll, failRoll:failRoll};
    };
};

function getBrightness(hex) {
	hex = hex.replace('#', '');
	var c_r = hexDec(hex.substr(0, 2));
	var c_g = hexDec(hex.substr(2, 2));
	var c_b = hexDec(hex.substr(4, 2));
	return ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
}

function hexDec(hex_string) {
	hex_string = (hex_string + '').replace(/[^a-f0-9]/gi, '');
	return parseInt(hex_string, 16);
}