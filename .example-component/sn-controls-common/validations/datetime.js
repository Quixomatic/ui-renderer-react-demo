/*
This utility function is a copy of following function getDateFromFormat in calendar.js
https://code.devsnc.com/dev/glide/blob/master/glide/ui.html/scripts/calendar.js#L284
The purpose of the function is to have same validation in dateTime format case when it has timezone enabled
example like "YYYY-MM-DD hh:mm:ss z". Remaining other formats are handled from moment itself.
getDateFromFormat is a validator function that checks if the date is in given format or not.
In case the date is not in correct format , it returns 0 , else it returns the time Value of the same.
*/

const digits = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);

function _isInteger(val) {
	for (let i = 0; i < val.length; i++) if (!digits.has(val[i])) return false;
	return true;
}

function _getInt(str, i, minlength, maxlength) {
	for (var x = maxlength; x >= minlength; x--) {
		var token = str.substring(i, i + x);
		if (token.length < minlength) {
			return null;
		}
		if (_isInteger(token)) {
			return token;
		}
	}
	return null;
}

/**
 * Validate Date String for a given format. Returns 0 if date is invalid for given format, else date value
 * @param {string} val - Date string.
 * @param {string} format - Format for which date string has to be verified.
 * @returns {number}
 */
export function getDateFromFormat(val, format) {
	val = val + '';
	format = format + '';
	var i_val = 0;
	var i_format = 0;
	var c = '';
	var token = '';
	var x, y;
	var now = new Date();
	var year = now.getYear();
	var month = now.getMonth() + 1;
	var date = 0;
	var hh = now.getHours();
	var mm = now.getMinutes();
	var ss = now.getSeconds();
	var ampm = '';
	var week = false;
	var MONTH_NAMES = new Array(
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	);
	var DAY_NAMES = new Array(
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
		'Sun',
		'Mon',
		'Tue',
		'Wed',
		'Thu',
		'Fri',
		'Sat'
	);
	var g_first_day_of_week = 1;

	while (i_format < format.length) {
		// Get next token from format string
		c = format.charAt(i_format);
		token = '';
		while (format.charAt(i_format) == c && i_format < format.length) {
			token += format.charAt(i_format++);
		}
		// Extract contents of value based on format token
		if (token == 'yyyy' || token == 'yy' || token == 'y') {
			if (token == 'yyyy') {
				x = 4;
				y = 4;
			}
			if (token == 'yy') {
				x = 2;
				y = 2;
			}
			if (token == 'y') {
				x = 2;
				y = 4;
			}
			year = _getInt(val, i_val, x, y);
			if (year == null) {
				return 0;
			}
			i_val += year.length;
			if (year.length == 2) {
				if (year > 70) {
					year = 1900 + (year - 0);
				} else {
					year = 2000 + (year - 0);
				}
			}
		} else if (token == 'MMM' || token == 'NNN') {
			month = 0;
			for (var i = 0; i < MONTH_NAMES.length; i++) {
				var month_name = MONTH_NAMES[i];
				if (
					val.substring(i_val, i_val + month_name.length).toLowerCase() ==
					month_name.toLowerCase()
				) {
					if (token == 'MMM' || (token == 'NNN' && i > 11)) {
						month = i + 1;
						if (month > 12) {
							month -= 12;
						}
						i_val += month_name.length;
						break;
					}
				}
			}
			if (month < 1 || month > 12) {
				return 0;
			}
		} else if (token == 'EE' || token == 'E') {
			for (var i2 = 0; i2 < DAY_NAMES.length; i2++) {
				var day_name = DAY_NAMES[i2];
				if (
					val.substring(i_val, i_val + day_name.length).toLowerCase() ==
					day_name.toLowerCase()
				) {
					if (week) {
						if (i2 == 0 || i2 == 7)
							//Sun
							date += 6;
						else if (i2 == 2 || i2 == 9)
							//Tues
							date += 1;
						else if (i2 == 3 || i2 == 10)
							//Wed
							date += 2;
						else if (i2 == 4 || i2 == 11)
							// Thur
							date += 3;
						else if (i2 == 5 || i2 == 12)
							//Fri
							date += 4;
						else if (i2 == 6 || i2 == 13)
							//sat
							date += 5;
					}
					i_val += day_name.length;
					break;
				}
			}
		} else if (token == 'MM' || token == 'M') {
			month = _getInt(val, i_val, token.length, 2);
			if (month == null || month < 1 || month > 12) {
				return 0;
			}
			i_val += month.length;
		} else if (token == 'dd' || token == 'd') {
			date = _getInt(val, i_val, token.length, 2);
			if (date == null || date < 1 || date > 31) {
				return 0;
			}
			i_val += date.length;
		} else if (token == 'hh' || token == 'h') {
			hh = _getInt(val, i_val, token.length, 2);
			if (hh == null || hh < 1 || hh > 12) {
				return 0;
			}
			i_val += hh.length;
		} else if (token == 'HH' || token == 'H') {
			hh = _getInt(val, i_val, token.length, 2);
			if (hh == null || hh < 0 || hh > 23) {
				return 0;
			}
			i_val += hh.length;
		} else if (token == 'KK' || token == 'K') {
			hh = _getInt(val, i_val, token.length, 2);
			if (hh == null || hh < 0 || hh > 11) {
				return 0;
			}
			i_val += hh.length;
		} else if (token == 'kk' || token == 'k') {
			hh = _getInt(val, i_val, token.length, 2);
			if (hh == null || hh < 1 || hh > 24) {
				return 0;
			}
			i_val += hh.length;
			hh--;
		} else if (token == 'mm' || token == 'm') {
			mm = _getInt(val, i_val, token.length, 2);
			if (mm == null || mm < 0 || mm > 59) {
				return 0;
			}
			i_val += mm.length;
		} else if (token == 'ss' || token == 's') {
			ss = _getInt(val, i_val, token.length, 2);
			if (ss == null || ss < 0 || ss > 59) {
				return 0;
			}
			i_val += ss.length;
		} else if (token == 'a') {
			if (val.substring(i_val, i_val + 2).toLowerCase() == 'am') {
				ampm = 'AM';
			} else if (val.substring(i_val, i_val + 2).toLowerCase() == 'pm') {
				ampm = 'PM';
			} else {
				return 0;
			}
			i_val += 2;
		} else if (token == 'w' || token == 'ww') {
			//week in year
			var weekNum = _getInt(val, i_val, token.length, 2);
			week = true;
			if (weekNum != null) {
				var temp = new Date(year, 0, 1, 0, 0, 0);
				temp.setWeek(parseInt(weekNum, 10));
				year = temp.getFullYear();
				month = temp.getMonth() + 1;
				date = temp.getDate();
			}
			weekNum += '';
			i_val += weekNum.length;
		} else if (token == 'D') {
			if (week) {
				var day = _getInt(val, i_val, token.length, 1);
				if (day == null || day <= 0 || day > 7) return 0;

				var temp2 = new Date(year, month - 1, date, hh, mm, ss);
				// get the current day of week that we are on (Sun=0)
				var dayOfWeek = temp2.getDay();

				// get the day we want and adjust that to Sun=0
				day = parseInt(day, 10);
				day = (day + g_first_day_of_week - 1) % 7;
				if (day == 0) day = 7;
				day--;

				// determine how many days we need to add to the current date
				if (day < dayOfWeek) day = 7 - (dayOfWeek - day);
				else day -= dayOfWeek;

				if (day > 0) {
					temp2.setDate(temp2.getDate() + day);

					// apply the date and get the year/month/date again since adding the date my rollover into next month
					year = temp2.getFullYear();
					month = temp2.getMonth() + 1;
					date = temp2.getDate();
				}
				i_val++;
			}
		} else if (token == 'z') i_val += 3;
		else {
			if (val.substring(i_val, i_val + token.length) != token) {
				return 0;
			} else {
				i_val += token.length;
			}
		}
	}
	// If there are any trailing characters left in the value, it doesn't match
	if (i_val != val.length) {
		return 0;
	}
	// Is date valid for month?
	if (month == 2) {
		// Check for leap year
		if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) {
			// leap year
			if (date > 29) {
				return 0;
			}
		} else {
			if (date > 28) {
				return 0;
			}
		}
	}
	if (month == 4 || month == 6 || month == 9 || month == 11) {
		if (date > 30) {
			return 0;
		}
	}
	// Correct hours value
	if (hh < 12 && ampm == 'PM') {
		hh = hh - 0 + 12;
	} else if (hh > 11 && ampm == 'AM') {
		hh -= 12;
	}
	var newdate = new Date(year, month - 1, date, hh, mm, ss);
	return newdate.getTime();
}
