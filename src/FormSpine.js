import Validator from './Validator';
import ErrorBag from './ErrorBag';
import fetch from 'unfetch';

export default function FormSpine(url, fields, customErrorMessages, clearOnSuccess) {
	this.errors = new ErrorBag;
	this.setupFields(fields);
	this.url = url;
	this.validator = new Validator(customErrorMessages);
	this.clearOnSuccess = clearOnSuccess !== undefined ? clearOnSuccess : false;

	this.setupFields = function (fields) {
		this.fields = {};
		this.originalValues = {};
		for (let field in fields) {
			fields[field]["value"] = fields[field].value ? fields[field].value : "";
			fields[field]["name"] = field;

			this.fields[field] = fields[field];
			this.originalValues[field] = this.fields[field].value;
		}
	};

	this.validate = function () {
		this.errors.clear();
		return this.validator.validate(this.fields);
	};

	this.data = function () {
		let formData = {};
		for (let field in this.fields) {
			formData[field] = this.fields[field].value;
		}
		return formData;
	};

	this.clear = function () {
		for (let field in this.fields) {
			this.fields[field].value = "";
		}
		this.errors.clear();
	};

	this.reset = function () {
		for (let field in this.fields) {
			this.fields[field].value = this.originalValues[field];
		}
		this.errors.clear();
	};

	this.submit = function (method) {
		return new Promise((resolve, reject) => {
			const validationResponse = this.validate();

			if (Object.keys(validationResponse).length > 0) {
				this.errors.set(validationResponse);
				reject(validationResponse);

				return false;
			}
			fetch[method](this.url, this.data()).then(response => {
				this.onSuccess(response.data);
				resolve(response.data);

				return true;
			}).catch((error) => {
				let responseError = "";
				if (error.response !== undefined && error.response.data !== undefined && typeof error.response.data === "object") {
					responseError = error.response.data;
				} else {
					responseError = error.response.statusText;
				}
				this.onFail(responseError);
				reject(responseError);

				return false;
			});
		});
	};

	this.onSuccess = function (data) {
		if (this.clearOnSuccess) {
			this.reset();
		}
	};

	this.onFail = function (errors) {
		if (typeof errors === "string") {
			errors = {
				general: [errors]
			};
		}
		this.errors.set(errors);
	};

	this.post = function () {
		return this.submit("post");
	};

	this.delete = function () {
		return this.submit("delete");
	};

	this.put = function () {
		return this.submit("put");
	};
}