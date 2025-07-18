export const parseArabic = value =>
	typeof value === 'string'
		? value
				.replace(/[\u0660-\u0669]/g, d => {
					return d.charCodeAt(0) - 1632; // Convert Arabic numbers
				})
				.replace(/[\u06F0-\u06F9]/g, d => {
					return d.charCodeAt(0) - 1776; // Convert Persian numbers
				})
		: value;
