/*!
 * Globalize
 *
 * http://github.com/jquery/globalize
 *
 * Copyright Software Freedom Conservancy, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 */

(function( window, undefined ) {

var Globalize,
	// private variables
	regexHex,
	regexInfinity,
	regexParseFloat,
	regexTrim,
	// private JavaScript utility functions
	arrayIndexOf,
	endsWith,
	extend,
	isArray,
	isFunction,
	isObject,
	startsWith,
	trim,
	truncate,
	zeroPad,
	// private Globalization utility functions
	appendPreOrPostMatch,
	expandFormat,
	formatDate,
	formatNumber,
	getTokenRegExp,
	getEra,
	getEraYear,
	parseExact,
	parseNegativePattern;

// Global variable (Globalize) or CommonJS module (globalize)
Globalize = function( cultureSelector ) {
	return new Globalize.prototype.init( cultureSelector );
};

if ( typeof require !== "undefined"
	&& typeof exports !== "undefined"
	&& typeof module !== "undefined" ) {
	// Assume CommonJS
	module.exports = Globalize;
} else {
	// Export as global variable
	window.Globalize = Globalize;
}

Globalize.cultures = {};

Globalize.prototype = {
	constructor: Globalize,
	init: function( cultureSelector ) {
		this.cultures = Globalize.cultures;
		this.cultureSelector = cultureSelector;

		return this;
	}
};
Globalize.prototype.init.prototype = Globalize.prototype;

// 1.	 When defining a culture, all fields are required except the ones stated as optional.
// 2.	 Each culture should have a ".calendars" object with at least one calendar named "standard"
//		 which serves as the default calendar in use by that culture.
// 3.	 Each culture should have a ".calendar" object which is the current calendar being used,
//		 it may be dynamically changed at any time to one of the calendars in ".calendars".
Globalize.cultures[ "default" ] = {
	// A unique name for the culture in the form <language code>-<country/region code>
	name: "en",
	// the name of the culture in the english language
	englishName: "English",
	// the name of the culture in its own language
	nativeName: "English",
	// whether the culture uses right-to-left text
	isRTL: false,
	// "language" is used for so-called "specific" cultures.
	// For example, the culture "es-CL" means "Spanish, in Chili".
	// It represents the Spanish-speaking culture as it is in Chili,
	// which might have different formatting rules or even translations
	// than Spanish in Spain. A "neutral" culture is one that is not
	// specific to a region. For example, the culture "es" is the generic
	// Spanish culture, which may be a more generalized version of the language
	// that may or may not be what a specific culture expects.
	// For a specific culture like "es-CL", the "language" field refers to the
	// neutral, generic culture information for the language it is using.
	// This is not always a simple matter of the string before the dash.
	// For example, the "zh-Hans" culture is netural (Simplified Chinese).
	// And the "zh-SG" culture is Simplified Chinese in Singapore, whose lanugage
	// field is "zh-CHS", not "zh".
	// This field should be used to navigate from a specific culture to it's
	// more general, neutral culture. If a culture is already as general as it
	// can get, the language may refer to itself.
	language: "en",
	// numberFormat defines general number formatting rules, like the digits in
	// each grouping, the group separator, and how negative numbers are displayed.
	numberFormat: {
		// [negativePattern]
		// Note, numberFormat.pattern has no "positivePattern" unlike percent and currency,
		// but is still defined as an array for consistency with them.
		//   negativePattern: one of "(n)|-n|- n|n-|n -"
		pattern: [ "-n" ],
		// number of decimal places normally shown
		decimals: 2,
		// string that separates number groups, as in 1,000,000
		",": ",",
		// string that separates a number from the fractional portion, as in 1.99
		".": ".",
		// array of numbers indicating the size of each number group.
		// TODO: more detailed description and example
		groupSizes: [ 3 ],
		// symbol used for positive numbers
		"+": "+",
		// symbol used for negative numbers
		"-": "-",
		// symbol used for NaN (Not-A-Number)
		NaN: "NaN",
		// symbol used for Negative Infinity
		negativeInfinity: "-Infinity",
		// symbol used for Positive Infinity
		positiveInfinity: "Infinity",
		percent: {
			// [negativePattern, positivePattern]
			//   negativePattern: one of "-n %|-n%|-%n|%-n|%n-|n-%|n%-|-% n|n %-|% n-|% -n|n- %"
			//   positivePattern: one of "n %|n%|%n|% n"
			pattern: [ "-n %", "n %" ],
			// number of decimal places normally shown
			decimals: 2,
			// array of numbers indicating the size of each number group.
			// TODO: more detailed description and example
			groupSizes: [ 3 ],
			// string that separates number groups, as in 1,000,000
			",": ",",
			// string that separates a number from the fractional portion, as in 1.99
			".": ".",
			// symbol used to represent a percentage
			symbol: "%"
		},
		currency: {
			// [negativePattern, positivePattern]
			//   negativePattern: one of "($n)|-$n|$-n|$n-|(n$)|-n$|n-$|n$-|-n $|-$ n|n $-|$ n-|$ -n|n- $|($ n)|(n $)"
			//   positivePattern: one of "$n|n$|$ n|n $"
			pattern: [ "($n)", "$n" ],
			// number of decimal places normally shown
			decimals: 2,
			// array of numbers indicating the size of each number group.
			// TODO: more detailed description and example
			groupSizes: [ 3 ],
			// string that separates number groups, as in 1,000,000
			",": ",",
			// string that separates a number from the fractional portion, as in 1.99
			".": ".",
			// symbol used to represent currency
			symbol: "$"
		}
	},
	// calendars defines all the possible calendars used by this culture.
	// There should be at least one defined with name "standard", and is the default
	// calendar used by the culture.
	// A calendar contains information about how dates are formatted, information about
	// the calendar's eras, a standard set of the date formats,
	// translations for day and month names, and if the calendar is not based on the Gregorian
	// calendar, conversion functions to and from the Gregorian calendar.
	calendars: {
		standard: {
			// name that identifies the type of calendar this is
			name: "Gregorian_USEnglish",
			// separator of parts of a date (e.g. "/" in 11/05/1955)
			"/": "/",
			// separator of parts of a time (e.g. ":" in 05:44 PM)
			":": ":",
			// the first day of the week (0 = Sunday, 1 = Monday, etc)
			firstDay: 0,
			days: {
				// full day names
				names: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
				// abbreviated day names
				namesAbbr: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ],
				// shortest day names
				namesShort: [ "Su", "Mo", "Tu", "We", "Th", "Fr", "Sa" ]
			},
			months: {
				// full month names (13 months for lunar calendards -- 13th month should be "" if not lunar)
				names: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December", "" ],
				// abbreviated month names
				namesAbbr: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "" ]
			},
			// AM and PM designators in one of these forms:
			// The usual view, and the upper and lower case versions
			//   [ standard, lowercase, uppercase ]
			// The culture does not use AM or PM (likely all standard date formats use 24 hour time)
			//   null
			AM: [ "AM", "am", "AM" ],
			PM: [ "PM", "pm", "PM" ],
			eras: [
				// eras in reverse chronological order.
				// name: the name of the era in this culture (e.g. A.D., C.E.)
				// start: when the era starts in ticks (gregorian, gmt), null if it is the earliest supported era.
				// offset: offset in years from gregorian calendar
				{
					"name": "A.D.",
					"start": null,
					"offset": 0
				}
			],
			// when a two digit year is given, it will never be parsed as a four digit
			// year greater than this year (in the appropriate era for the culture)
			// Set it as a full year (e.g. 2029) or use an offset format starting from
			// the current year: "+19" would correspond to 2029 if the current year 2010.
			twoDigitYearMax: 2029,
			// set of predefined date and time patterns used by the culture
			// these represent the format someone in this culture would expect
			// to see given the portions of the date that are shown.
			patterns: {
				// short date pattern
				d: "M/d/yyyy",
				// long date pattern
				D: "dddd, MMMM dd, yyyy",
				// short time pattern
				t: "h:mm tt",
				// long time pattern
				T: "h:mm:ss tt",
				// long date, short time pattern
				f: "dddd, MMMM dd, yyyy h:mm tt",
				// long date, long time pattern
				F: "dddd, MMMM dd, yyyy h:mm:ss tt",
				// month/day pattern
				M: "MMMM dd",
				// month/year pattern
				Y: "yyyy MMMM",
				// S is a sortable format that does not vary by culture
				S: "yyyy\u0027-\u0027MM\u0027-\u0027dd\u0027T\u0027HH\u0027:\u0027mm\u0027:\u0027ss"
			}
			// optional fields for each calendar:
			/*
			monthsGenitive:
				Same as months but used when the day preceeds the month.
				Omit if the culture has no genitive distinction in month names.
				For an explaination of genitive months, see http://blogs.msdn.com/michkap/archive/2004/12/25/332259.aspx
			convert:
				Allows for the support of non-gregorian based calendars. This convert object is used to
				to convert a date to and from a gregorian calendar date to handle parsing and formatting.
				The two functions:
					fromGregorian( date )
						Given the date as a parameter, return an array with parts [ year, month, day ]
						corresponding to the non-gregorian based year, month, and day for the calendar.
					toGregorian( year, month, day )
						Given the non-gregorian year, month, and day, return a new Date() object
						set to the corresponding date in the gregorian calendar.
			*/
		}
	},
	// For localized strings
	messages: {}
};

Globalize.cultures[ "default" ].calendar = Globalize.cultures[ "default" ].calendars.standard;

Globalize.cultures[ "en" ] = Globalize.cultures[ "default" ];

Globalize.cultureSelector = "en";

//
// private variables
//

regexHex = /^0x[a-f0-9]+$/i;
regexInfinity = /^[+-]?infinity$/i;
regexParseFloat = /^[+-]?\d*\.?\d*(e[+-]?\d+)?$/;
regexTrim = /^\s+|\s+$/g;

//
// private JavaScript utility functions
//

arrayIndexOf = function( array, item ) {
	if ( array.indexOf ) {
		return array.indexOf( item );
	}
	for ( var i = 0, length = array.length; i < length; i++ ) {
		if ( array[i] === item ) {
			return i;
		}
	}
	return -1;
};

endsWith = function( value, pattern ) {
	return value.substr( value.length - pattern.length ) === pattern;
};

extend = function( deep ) {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !isFunction(target) ) {
		target = {};
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( isObject(copy) || (copyIsArray = isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && isArray(src) ? src : [];

					} else {
						clone = src && isObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

isArray = Array.isArray || function( obj ) {
	return Object.prototype.toString.call( obj ) === "[object Array]";
};

isFunction = function( obj ) {
	return Object.prototype.toString.call( obj ) === "[object Function]"
}

isObject = function( obj ) {
	return Object.prototype.toString.call( obj ) === "[object Object]";
};

startsWith = function( value, pattern ) {
	return value.indexOf( pattern ) === 0;
};

trim = function( value ) {
	return ( value + "" ).replace( regexTrim, "" );
};

truncate = function( value ) {
	return value | 0;
};

zeroPad = function( str, count, left ) {
	var l;
	for ( l = str.length; l < count; l += 1 ) {
		str = ( left ? ("0" + str) : (str + "0") );
	}
	return str;
};

//
// private Globalization utility functions
//

appendPreOrPostMatch = function( preMatch, strings ) {
	// appends pre- and post- token match strings while removing escaped characters.
	// Returns a single quote count which is used to determine if the token occurs
	// in a string literal.
	var quoteCount = 0,
		escaped = false;
	for ( var i = 0, il = preMatch.length; i < il; i++ ) {
		var c = preMatch.charAt( i );
		switch ( c ) {
			case "\'":
				if ( escaped ) {
					strings.push( "\'" );
				}
				else {
					quoteCount++;
				}
				escaped = false;
				break;
			case "\\":
				if ( escaped ) {
					strings.push( "\\" );
				}
				escaped = !escaped;
				break;
			default:
				strings.push( c );
				escaped = false;
				break;
		}
	}
	return quoteCount;
};

expandFormat = function( cal, format ) {
	// expands unspecified or single character date formats into the full pattern.
	format = format || "F";
	var pattern,
		patterns = cal.patterns,
		len = format.length;
	if ( len === 1 ) {
		pattern = patterns[ format ];
		if ( !pattern ) {
			throw "Invalid date format string \'" + format + "\'.";
		}
		format = pattern;
	}
	else if ( len === 2 && format.charAt(0) === "%" ) {
		// %X escape format -- intended as a custom format string that is only one character, not a built-in format.
		format = format.charAt( 1 );
	}
	return format;
};

formatDate = function( value, format, culture ) {
	var cal = culture.calendar,
		convert = cal.convert;

	if ( !format || !format.length || format === "i" ) {
		var ret;
		if ( culture && culture.name.length ) {
			if ( convert ) {
				// non-gregorian calendar, so we cannot use built-in toLocaleString()
				ret = formatDate( value, cal.patterns.F, culture );
			}
			else {
				var eraDate = new Date( value.getTime() ),
					era = getEra( value, cal.eras );
				eraDate.setFullYear( getEraYear(value, cal, era) );
				ret = eraDate.toLocaleString();
			}
		}
		else {
			ret = value.toString();
		}
		return ret;
	}

	var eras = cal.eras,
		sortable = format === "s";
	format = expandFormat( cal, format );

	// Start with an empty string
	ret = [];
	var hour,
		zeros = [ "0", "00", "000" ],
		foundDay,
		checkedDay,
		dayPartRegExp = /([^d]|^)(d|dd)([^d]|$)/g,
		quoteCount = 0,
		tokenRegExp = getTokenRegExp(),
		converted;

	function padZeros( num, c ) {
		var r, s = num + "";
		if ( c > 1 && s.length < c ) {
			r = ( zeros[c - 2] + s);
			return r.substr( r.length - c, c );
		}
		else {
			r = s;
		}
		return r;
	}

	function hasDay() {
		if ( foundDay || checkedDay ) {
			return foundDay;
		}
		foundDay = dayPartRegExp.test( format );
		checkedDay = true;
		return foundDay;
	}

	function getPart( date, part ) {
		if ( converted ) {
			return converted[ part ];
		}
		switch ( part ) {
			case 0: return date.getFullYear();
			case 1: return date.getMonth();
			case 2: return date.getDate();
		}
	}

	if ( !sortable && convert ) {
		converted = convert.fromGregorian( value );
	}

	for ( ; ; ) {
		// Save the current index
		var index = tokenRegExp.lastIndex,
			// Look for the next pattern
			ar = tokenRegExp.exec( format );

		// Append the text before the pattern (or the end of the string if not found)
		var preMatch = format.slice( index, ar ? ar.index : format.length );
		quoteCount += appendPreOrPostMatch( preMatch, ret );

		if ( !ar ) {
			break;
		}

		// do not replace any matches that occur inside a string literal.
		if ( quoteCount % 2 ) {
			ret.push( ar[0] );
			continue;
		}

		var current = ar[ 0 ],
			clength = current.length;

		switch ( current ) {
			case "ddd":
				//Day of the week, as a three-letter abbreviation
			case "dddd":
				// Day of the week, using the full name
				var names = ( clength === 3 ) ? cal.days.namesAbbr : cal.days.names;
				ret.push( names[value.getDay()] );
				break;
			case "d":
				// Day of month, without leading zero for single-digit days
			case "dd":
				// Day of month, with leading zero for single-digit days
				foundDay = true;
				ret.push(
					padZeros( getPart(value, 2), clength )
				);
				break;
			case "MMM":
				// Month, as a three-letter abbreviation
			case "MMMM":
				// Month, using the full name
				var part = getPart( value, 1 );
				ret.push(
					( cal.monthsGenitive && hasDay() )
					?
					cal.monthsGenitive[ clength === 3 ? "namesAbbr" : "names" ][ part ]
					:
					cal.months[ clength === 3 ? "namesAbbr" : "names" ][ part ]
				);
				break;
			case "M":
				// Month, as digits, with no leading zero for single-digit months
			case "MM":
				// Month, as digits, with leading zero for single-digit months
				ret.push(
					padZeros( getPart(value, 1) + 1, clength )
				);
				break;
			case "y":
				// Year, as two digits, but with no leading zero for years less than 10
			case "yy":
				// Year, as two digits, with leading zero for years less than 10
			case "yyyy":
				// Year represented by four full digits
				part = converted ? converted[ 0 ] : getEraYear( value, cal, getEra(value, eras), sortable );
				if ( clength < 4 ) {
					part = part % 100;
				}
				ret.push(
					padZeros( part, clength )
				);
				break;
			case "h":
				// Hours with no leading zero for single-digit hours, using 12-hour clock
			case "hh":
				// Hours with leading zero for single-digit hours, using 12-hour clock
				hour = value.getHours() % 12;
				if ( hour === 0 ) hour = 12;
				ret.push(
					padZeros( hour, clength )
				);
				break;
			case "H":
				// Hours with no leading zero for single-digit hours, using 24-hour clock
			case "HH":
				// Hours with leading zero for single-digit hours, using 24-hour clock
				ret.push(
					padZeros( value.getHours(), clength )
				);
				break;
			case "m":
				// Minutes with no leading zero for single-digit minutes
			case "mm":
				// Minutes with leading zero for single-digit minutes
				ret.push(
					padZeros( value.getMinutes(), clength )
				);
				break;
			case "s":
				// Seconds with no leading zero for single-digit seconds
			case "ss":
				// Seconds with leading zero for single-digit seconds
				ret.push(
					padZeros( value.getSeconds(), clength )
				);
				break;
			case "t":
				// One character am/pm indicator ("a" or "p")
			case "tt":
				// Multicharacter am/pm indicator
				part = value.getHours() < 12 ? ( cal.AM ? cal.AM[0] : " " ) : ( cal.PM ? cal.PM[0] : " " );
				ret.push( clength === 1 ? part.charAt(0) : part );
				break;
			case "f":
				// Deciseconds
			case "ff":
				// Centiseconds
			case "fff":
				// Milliseconds
				ret.push(
					padZeros( value.getMilliseconds(), 3 ).substr( 0, clength )
				);
				break;
			case "z":
				// Time zone offset, no leading zero
			case "zz":
				// Time zone offset with leading zero
				hour = value.getTimezoneOffset() / 60;
				ret.push(
					( hour <= 0 ? "+" : "-" ) + padZeros( Math.floor(Math.abs(hour)), clength )
				);
				break;
			case "zzz":
				// Time zone offset with leading zero
				hour = value.getTimezoneOffset() / 60;
				ret.push(
					( hour <= 0 ? "+" : "-" ) + padZeros( Math.floor(Math.abs(hour)), 2 )
					// Hard coded ":" separator, rather than using cal.TimeSeparator
					// Repeated here for consistency, plus ":" was already assumed in date parsing.
					+ ":" + padZeros( Math.abs(value.getTimezoneOffset() % 60), 2 )
				);
				break;
			case "g":
			case "gg":
				if ( cal.eras ) {
					ret.push(
						cal.eras[ getEra(value, eras) ].name
					);
				}
				break;
		case "/":
			ret.push( cal["/"] );
			break;
		default:
			throw "Invalid date format pattern \'" + current + "\'.";
			break;
		}
	}
	return ret.join( "" );
};

// formatNumber
(function() {
	var expandNumber;

	expandNumber = function( number, precision, formatInfo ) {
		var groupSizes = formatInfo.groupSizes,
			curSize = groupSizes[ 0 ],
			curGroupIndex = 1,
			factor = Math.pow( 10, precision ),
			rounded = Math.round( number * factor ) / factor;

		if ( !isFinite(rounded) ) {
			rounded = number;
		}
		number = rounded;

		var numberString = number+"",
			right = "",
			split = numberString.split( /e/i ),
			exponent = split.length > 1 ? parseInt( split[1], 10 ) : 0;
		numberString = split[ 0 ];
		split = numberString.split( "." );
		numberString = split[ 0 ];
		right = split.length > 1 ? split[ 1 ] : "";

		var l;
		if ( exponent > 0 ) {
			right = zeroPad( right, exponent, false );
			numberString += right.slice( 0, exponent );
			right = right.substr( exponent );
		}
		else if ( exponent < 0 ) {
			exponent = -exponent;
			numberString = zeroPad( numberString, exponent + 1 );
			right = numberString.slice( -exponent, numberString.length ) + right;
			numberString = numberString.slice( 0, -exponent );
		}

		if ( precision > 0 ) {
			right = formatInfo[ "." ] +
				( (right.length > precision) ? right.slice(0, precision) : zeroPad(right, precision) );
		}
		else {
			right = "";
		}

		var stringIndex = numberString.length - 1,
			sep = formatInfo[ "," ],
			ret = "";

		while ( stringIndex >= 0 ) {
			if ( curSize === 0 || curSize > stringIndex ) {
				return numberString.slice( 0, stringIndex + 1 ) + ( ret.length ? (sep + ret + right) : right );
			}
			ret = numberString.slice( stringIndex - curSize + 1, stringIndex + 1 ) + ( ret.length ? (sep + ret) : "" );

			stringIndex -= curSize;

			if ( curGroupIndex < groupSizes.length ) {
				curSize = groupSizes[ curGroupIndex ];
				curGroupIndex++;
			}
		}

		return numberString.slice( 0, stringIndex + 1 ) + sep + ret + right;
	};

	formatNumber = function( value, format, culture ) {
		if ( !isFinite(value) ) {
			if ( value === Infinity ) {
				return culture.numberFormat.positiveInfinity;
			}
			if ( value === -Infinity ) {
				return culture.numberFormat.negativeInfinity;
			}
			return culture.numberFormat.NaN;
		}
		if ( !format || format === "i" ) {
			return culture.name.length ? value.toLocaleString() : value.toString();
		}
		format = format || "D";

		var nf = culture.numberFormat,
			number = Math.abs( value ),
			precision = -1,
			pattern;
		if ( format.length > 1 ) precision = parseInt( format.slice(1), 10 );

		var current = format.charAt( 0 ).toUpperCase(),
			formatInfo;

		switch ( current ) {
			case "D":
				pattern = "n";
				number = truncate( number );
				if ( precision !== -1 ) {
					number = zeroPad( "" + number, precision, true );
				}
				if ( value < 0 ) number = "-" + number;
				break;
			case "N":
				formatInfo = nf;
				// fall through
			case "C":
				formatInfo = formatInfo || nf.currency;
				// fall through
			case "P":
				formatInfo = formatInfo || nf.percent;
				pattern = value < 0 ? formatInfo.pattern[ 0 ] : ( formatInfo.pattern[1] || "n" );
				if ( precision === -1 ) precision = formatInfo.decimals;
				number = expandNumber( number * (current === "P" ? 100 : 1), precision, formatInfo );
				break;
			default:
				throw "Bad number format specifier: " + current;
		}

		var patternParts = /n|\$|-|%/g,
			ret = "";
		for ( ; ; ) {
			var index = patternParts.lastIndex,
				ar = patternParts.exec( pattern );

			ret += pattern.slice( index, ar ? ar.index : pattern.length );

			if ( !ar ) {
				break;
			}

			switch ( ar[0] ) {
				case "n":
					ret += number;
					break;
				case "$":
					ret += nf.currency.symbol;
					break;
				case "-":
					// don't make 0 negative
					if ( /[1-9]/.test(number) ) {
						ret += nf[ "-" ];
					}
					break;
				case "%":
					ret += nf.percent.symbol;
					break;
			}
		}

		return ret;
	};

}());

getTokenRegExp = function() {
	// regular expression for matching date and time tokens in format strings.
	return /\/|dddd|ddd|dd|d|MMMM|MMM|MM|M|yyyy|yy|y|hh|h|HH|H|mm|m|ss|s|tt|t|fff|ff|f|zzz|zz|z|gg|g/g;
};

getEra = function( date, eras ) {
	if ( !eras ) return 0;
	var start, ticks = date.getTime();
	for ( var i = 0, l = eras.length; i < l; i++ ) {
		start = eras[ i ].start;
		if ( start === null || ticks >= start ) {
			return i;
		}
	}
	return 0;
};

getEraYear = function( date, cal, era, sortable ) {
	var year = date.getFullYear();
	if ( !sortable && cal.eras ) {
		// convert normal gregorian year to era-shifted gregorian
		// year by subtracting the era offset
		year -= cal.eras[ era ].offset;
	}
	return year;
};

// parseExact
(function() {
	var expandYear,
		getDayIndex,
		getMonthIndex,
		getParseRegExp,
		outOfRange,
		toUpper,
		toUpperArray;

	expandYear = function( cal, year ) {
		// expands 2-digit year into 4 digits.
		var now = new Date(),
			era = getEra( now );
		if ( year < 100 ) {
			var twoDigitYearMax = cal.twoDigitYearMax;
			twoDigitYearMax = typeof twoDigitYearMax === "string" ? new Date().getFullYear() % 100 + parseInt( twoDigitYearMax, 10 ) : twoDigitYearMax;
			var curr = getEraYear( now, cal, era );
			year += curr - ( curr % 100 );
			if ( year > twoDigitYearMax ) {
				year -= 100;
			}
		}
		return year;
	};

	getDayIndex = function	( cal, value, abbr ) {
		var ret,
			days = cal.days,
			upperDays = cal._upperDays;
		if ( !upperDays ) {
			cal._upperDays = upperDays = [
				toUpperArray( days.names ),
				toUpperArray( days.namesAbbr ),
				toUpperArray( days.namesShort )
			];
		}
		value = toUpper( value );
		if ( abbr ) {
			ret = arrayIndexOf( upperDays[1], value );
			if ( ret === -1 ) {
				ret = arrayIndexOf( upperDays[2], value );
			}
		}
		else {
			ret = arrayIndexOf( upperDays[0], value );
		}
		return ret;
	};

	getMonthIndex = function( cal, value, abbr ) {
		var months = cal.months,
			monthsGen = cal.monthsGenitive || cal.months,
			upperMonths = cal._upperMonths,
			upperMonthsGen = cal._upperMonthsGen;
		if ( !upperMonths ) {
			cal._upperMonths = upperMonths = [
				toUpperArray( months.names ),
				toUpperArray( months.namesAbbr )
			];
			cal._upperMonthsGen = upperMonthsGen = [
				toUpperArray( monthsGen.names ),
				toUpperArray( monthsGen.namesAbbr )
			];
		}
		value = toUpper( value );
		var i = arrayIndexOf( abbr ? upperMonths[1] : upp