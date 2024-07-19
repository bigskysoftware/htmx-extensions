(function () {
	htmx.defineExtension('attributes', {
		handleSwap: function (swapStyle, target, fragment) {
			var source = fragment.firstElementChild || fragment;

			if (swapStyle === 'attributes') {
				var isOobSwap = source.attributes['hx-swap-oob'];
				if (isOobSwap) {
					var oobSelector = source.attributes['id'].value;
					var actualTarget = htmx.find('#' + oobSelector);
					if (actualTarget) {
						this.swapAttributes(actualTarget, source);
					}
				} else {
					this.swapAttributes(target, source);
				}
				return true;
			}
			return false;
		},

		swapAttributes: function (target, source) {
			function forEach(arr, func) {
				if (arr) {
					for (let i = 0; i < arr.length; i++) {
						func(arr[i]);
					}
				}
			}

			var keepAttributes = new Set(['id', 'hx-ext']);
			forEach(target.attributes, function (attr) {
				if (!keepAttributes.has(attr.name)) {
					target.removeAttribute(attr.name);
				}
			});

			forEach(source.attributes, function (attr) {
				if (attr.name !== 'hx-swap-oob' && !keepAttributes.has(attr.name)) {
					target.setAttribute(attr.name, attr.value);
				}
			});

			if (typeof window['_hyperscript'] !== 'undefined') {
				window['_hyperscript'].processNode(target);
			}
		},
	});
})();
