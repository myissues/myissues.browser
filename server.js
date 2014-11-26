
const PATH = require("path");
const SMI_CACHE = require("smi.cache");


require("io.pinf.server.www").for(module, __dirname, function(app, config) {

	// TODO: Use cache path instead of data path.
	var cache = new SMI_CACHE.UrlProxyCache(PATH.join(process.env.PIO_SERVICE_DATA_BASE_PATH, "cache"), {
		ttl: 0    // Indefinite by default.
	});


	function formatIssues (_issues, callback) {

		var issues = {};

		_issues.forEach(function (issue) {
			if (!issues[issue._filter.tag.value]) {
				issues[issue._filter.tag.value] = {};
			}
			issues[issue._filter.tag.value][issue.id] = issue;

			if (!issue.$display) {
				issue.$display = {};
			}
			issue.$display.project = issue.repository.replace(/^github\.com\/([^\/]+)\/([^\/]+)$/, "$2");
			issue.$display.updatedOn = new Date(issue.updatedOn).toGMTString();
			issue.$display.assignedTo = (issue.assignedTo || "").replace(/^github\.com\//, "");
		});

		var groups = Object.keys(issues);
		groups.sort();
		groups = groups.reverse();

		return callback(null, {
			order: groups,
			values: issues
		});
	}

	app.get(/^\/tagged\/([^\/]+)$/, function (req, res, next) {

		if (req.params[0]=== "list.htm") {
			return next();
		}

		var url = "http://127.0.0.1:8106/service/io.devcomp.portal/2-views/issues.json?tag=" + encodeURIComponent(req.params[0]);

		return cache.get(url, {
			loadBody: true,
			ttl: 5 * 1000,
			verbose: true,
			debug: true,
			useExistingOnError: true
		}, function(err, response) {
			if (err) return next(err);

			return formatIssues(JSON.parse(response.body.toString()), function (err, issues) {
				if (err) return next(err);

				req.url = "/tagged/list.htm";
				if (!res.view) {
					res.view = {};
				}
				res.view.issues = issues;

console.log("SET ISSUES 2", issues);

				return next();
			});
		});
	});

	app.get(/^\/tagged\/([^\/]+)\/([^\/]+)$/, function (req, res, next) {

		var url = "http://127.0.0.1:8106/service/io.devcomp.portal/2-views/issues.json?tag=" + encodeURIComponent(req.params[0] + ";" + req.params[1]);

		return cache.get(url, {
			loadBody: true,
			ttl: 5 * 1000,
			verbose: true,
			debug: true,
			useExistingOnError: true
		}, function(err, response) {
			if (err) return next(err);

			return formatIssues(JSON.parse(response.body.toString()), function (err, issues) {
				if (err) return next(err);

				req.url = "/tagged/list.htm";
				if (!res.view) {
					res.view = {};
				}
				res.view.issues = issues;
console.log("SET ISSUES 1", issues);


				return next();
			});
		});
	});

});
