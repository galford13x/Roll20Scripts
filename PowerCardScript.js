// VARIABLE & FUNCTION DECLARATIONS -- DO NOT ALTER!!
var PowerCardScript = PowerCardScript || {};
var getBrightness = getBrightness || {};
var hexDec = hexDec || {};

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
//ApiCommands = ApiCommands || {};

PowerCardScript.Process = function(msg){
    // DEFINE VARIABLES
    var n = msg.content.split(" --");
	var PowerCard = {};
	var DisplayCard = "";
	//var NumberOfAttacks = 0;
	//var NumberOfDmgRolls = 0;
    //var NumberOfRolls = 0;
	var Tag = "";
	var Content = "";

	// CREATE POWERCARD OBJECT ARRAY
	var a = 1;
    var a = 1;
	while (n[a]) {
		Tag = n[a].substring(0, n[a].indexOf("|"));
		Content = n[a].substring(n[a].indexOf("|") + 1);
		PowerCard[Tag] = Content;
        log("Assigning Content: " + Tag + "=" + Content);
		a++;
	}
    
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
    
	// KEY LOOP
	var Keys = Object.keys(PowerCard);
    log("Key Count: " + Keys.length);
    log(Keys);
    AttackCount = 0;
	var ReservedTags = "attack, damage, multiroll, lb";
	var IgnoredTags = "format, emote, name, usage, action, defense, txcolor, bgcolor, leftsub, rightsub, ddn, desc, crit, title";
	while (KeyCount < Keys.length) {
		Tag = Keys[KeyCount];
		Content = PowerCard[Keys[KeyCount]];
        log("Proc Tag: " + Tag + " = " + Content);
		if (Tag.charAt(0) === "^") {
			Indent = (parseInt(Tag.charAt(1)) > 0) ? Tag.charAt(1) : 1;
			Tag = (parseInt(Tag.charAt(1)) > 0) ? Tag.substring(2) : Tag.substring(1);
			RowStyle += " padding-left: " + (Indent * 1.5) + "em;";
		}
        
		// CHECK FOR RESERVED & IGNORED TAGS
		if (PowerCardScript.isReserved(Tag, ReservedTags)){
//    	if (ReservedTags.indexOf(Tag) != -1) {
			// ATTACK ROLLS
			if (Tag.substring(0, 6).toLowerCase() == "attack") {
                log("Pre - " + Tag);
                log(DisplayCard);
    			RowBackground = (RowNumber % 2 == 1) ? OddRow : EvenRow;
				RowNumber += 1;
                switch (PowerCard.format) {
                    case "dnd4e": {
                        if (AttackCount == 0) PowerCard[Tag] = PowerCard[Tag].replace("]]", "]] vs " + PowerCard.defense + " ");
                        DisplayCard += "<div style='" + RowStyle + RowBackground + "'>" + PowerCard[Tag] + "</div>";
                        break;
                    }
                    case "ddn": {
                        DisplayCard += "<div style='" + RowStyle + RowBackground + "'>[ " + PowerCard[Tag] + " ] vs Armor Class</div>";
                        break;
                    }
                    default:
                        DisplayCard += "<div style='" + RowStyle + RowBackground + "'>" + PowerCard[Tag] + "</div>";
                }
                AttackCount++;
                log(DisplayCard);
			}
            
			// DAMAGE ROLLS
			if (Tag.substring(0, 6).toLowerCase() == "damage") {
                log("Pre - " + Tag);
                log(DisplayCard);
				RowBackground = (RowNumber % 2 == 1) ? OddRow : EvenRow;
				RowNumber += 1;
				DisplayCard += "<div style='" + RowStyle + RowBackground + "'>" + PowerCard[Tag] + "</div>";
                log(DisplayCard);
			}
            
            // MULTIROLLS
            if (Tag.substring(0, 9).toLowerCase() == "multiroll") {
                log("Pre - " + Tag);
                log(DisplayCard);
                RowBackground = (RowNumber % 2 == 1) ? OddRow : EvenRow;
				RowNumber += 1;
				DisplayCard += "<div style='" + RowStyle + RowBackground + "'>" + PowerCard[Tag] + "</div>";
                log(DisplayCard);
            }
            
            // LINE BREAK
            if (Tag.toLowerCase() == "lb") {
                DisplayCard += "<div style='" + RowStyle + RowBackground + "'> </div>";
                DisplayCard += "<div style='" + RowStyle + RowBackground + "'>" + PowerCard.lb + "</div>";
                log(PowerCard.lb);
            }
		} else if (IgnoredTags.indexOf(Tag.toLowerCase()) != -1) {
			if(Tag.toLowerCase() == "title"){
			    
			}
		} else {
            log("Processing Tag: " + Tag);
			RowBackground = (RowNumber % 2 == 1) ? OddRow : EvenRow;
			RowNumber += 1;
			DisplayCard += "<div style='" + RowStyle + RowBackground + "'><b>" + Tag + ":</b> " + Content + "</div>";
		}
		KeyCount++;
	}
    log("Pre - Inline");
    log(DisplayCard);
	// ADD ROUNDED CORNERS & BORDER TO BOTTOM OF POWER CARD
	if (POWERCARD_ROUNDED_CORNERS && KeyCount == (Keys.length)) DisplayCard = DisplayCard.replace(/border-radius: 0px;(?!.*border-radius: 0px;)/g, "border-radius: 0px 0px 10px 10px; border-bottom: " + POWERCARD_BORDER_SIZE + "px solid " + POWERCARD_BORDER_COLOR + ";");
	if (!POWERCARD_ROUNDED_CORNERS && POWERCARD_BORDER_SIZE) DisplayCard = DisplayCard.replace(/border-radius: 0px;(?!.*border-radius: 0px;)/g, "border-bottom: " + POWERCARD_BORDER_SIZE + "px solid " + POWERCARD_BORDER_COLOR + ";");
    
    	// INLINE ROLLS REPLACEMENT
		var Count = 0;
		if (msg.inlinerolls !== undefined) {
            /*********************************************************
             *      Start Changes
             * This is where the Change Occurs.  No more while(...){}
            *********************************************************/
            //log(msg.inlinerolls)
            // We cycle through each original inline roll
            // the new buildinlineroll simply takes the oriiginal inlineroll object
            // and optionally the crit value for modified crits
            for(var i = 0; i < msg.inlinerolls.length; i++){
                var inlinerollValue = PowerCardScript.buildInline(msg.inlinerolls[i], PowerCard.crit);
                log(DisplayCard);
                log("");
                DisplayCard = DisplayCard.replace("$[[" + i + "]]", inlinerollValue); // just like before
                log(DisplayCard);
            }
			if (DisplayCard.search(/\$\[\[\d+\]\]/g) == -1) {
				// SEND OUTPUT TO CHAT
				if (PowerCard.emote !== undefined) sendChat(msg.who, "/emas " + PowerCard.emote);
				if (PowerCard.desc !== undefined) sendChat("", "/desc ");
				sendChat("", "/direct " + DisplayCard);
			}
            else {
                log("---- Error occured --")
                log(DisplayCard);
    			sendChat("", "/direct " + DisplayCard);
                sendChat("PowerCardScript", "Error occured");
                
            }
            /****************************************************
             *      End Changes
             ***************************************************/
		} else {
        // NO INLINE ROLLS
		if (PowerCard.emote !== undefined) sendChat(msg.who, "/emas " + PowerCard.emote);
		if (PowerCard.desc !== undefined) sendChat("", "/desc ");
    	sendChat("", "/direct " + DisplayCard);
	}
    //log(DisplayCard);
}

PowerCardScript.isReserved = function(Tag, reservedList){
    return  Tag.substring(0, 6).toLowerCase() == "attack" ||
            Tag.substring(0, 6).toLowerCase() == "damage" ||
            Tag.substring(0, 9).toLowerCase() == "multiroll" ||
            reservedList.indexOf(Tag) != -1;
}

/**************************************************************
 *      Start Changes
 *      New buildinline Function and helpers start here
 * 
 *************************************************************/
PowerCardScript.buildInline = function(inlineroll, crit){
    var InlineBorderRadius = (POWERCARD_ROUNDED_INLINE_ROLLS) ? 5 : 0;
    var values = [];
    var critRoll = false;
    var failRoll = false;
//    log(inlineroll);
    inlineroll.results.rolls.forEach(function(roll){
        var result = PowerCardScript.processRoll(roll, crit, false, false);
        values.push(result.value);
        critRoll = critRoll || result.critRoll;
        failRoll = failRoll || result.failRoll;
    });
//    log(values.join(""));
    //log("Crit:" + critRoll);
    //log("Fail:" + failRoll);
    var rollOut = '<span style="text-align: center; vertical-align: text-middle; display: inline-block; min-width: 1.75em; border-radius: ' + InlineBorderRadius + 'px; padding: 2px 0px 0px 0px;" title="Rolling ' + inlineroll.expression + ' = ' + values.join("");
    rollOut += '" class="a inlinerollresult showtip tipsy-n';
    rollOut += (critRoll && failRoll ? ' importantroll' : (critRoll ? ' fullcrit' : (failRoll ? ' fullfail' : ''))) + '">' + inlineroll.results.total + '</span>';
//    sendChat("", rollOut);
    return rollOut;
};

/******************************
 * Process a single roll result from an inline roll
 * roll (required): object from inlineroll.results.rolls array
 * crit (optional): the modified crit value (defaults to the maximum die value)
 * critRoll (optional): true if the roll contains a crit
 * failRoll: (optional): true if the roll contains a fail roll (roll of 1)
 */
PowerCardScript.processRoll = function(roll, crit, critRoll, failRoll){
    if(roll.type === "M") return {value: roll.expr, critRoll:critRoll, failRoll:failRoll};
    else if(roll.type === "R"){
        log("Processing Roll");
        var rollValues = [];
        log(roll);
        crit = crit || roll.sides;
        roll.results.forEach(function(result){
            if(crit && result.v >= crit) critRoll = true;
            else if(result.v === roll.sides) critRoll = true;
            else if(result.v === 1) failRoll = true;
            rollValues.push(result.v);
        });
        var rollResultVal = {value: "(" + rollValues.join("+") + ")", critRoll:critRoll, failRoll:failRoll};
        log(rollResultVal);
        return rollResultVal;
    }
    else if(roll.type === "G"){
        log("Processing Group Rolls")
        var grollVal = [];
        log(roll);
        roll.rolls.forEach(function(groll){
            groll.forEach(function(groll2){
                log(groll);
                var result = PowerCardScript.processRoll(groll2, crit);
                grollVal.push(result.value);
                critRoll = critRoll || result.critRoll;
                failRoll = failRoll || result.failRoll;
            })
        });
        return {value: "{" + grollVal.join("") + "}", critRoll:critRoll, failRoll:failRoll};
    };
};
/**************************************************************
 *      End Changes
 *************************************************************/

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