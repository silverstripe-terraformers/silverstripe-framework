/**
 * File: LeftAndMain.Layout.js
 */

(function($) {

	$.fn.layout.defaults.resize = false;

	var minMenuWidth = 40;
	var prefPreviewWidth = 500;
	var minPreviewWidth = 400;

	jLayout = (typeof jLayout === 'undefined') ? {} : jLayout;

	jLayout.threeColumnCompressor = function (spec) {
		var obj = {}, menu = $.jLayoutWrap(spec.menu), content = $.jLayoutWrap(spec.content), preview = $.jLayoutWrap(spec.preview);

		obj.layout = function (container) {
			var contentHidden = (content.item.is('.is-collapsed'));

			var size = container.bounds(),
				insets = container.insets(),
				top = insets.top,
				bottom = size.height - insets.bottom,
				left = insets.left,
				right = size.width - insets.right;

			if (contentHidden) {
				var menuWidth = 150;
				var contentWidth = 0
				var previewWidth = right - left - (menuWidth + contentWidth);

				// If preview width is less than the minimum size, take some off the menu
				if (previewWidth < prefPreviewWidth) {
					menuWidth = minMenuWidth;
					previewWidth = right - left - (menuWidth + contentWidth);
				}
			}
			else {
				var menuWidth = 150;
				var contentWidth = 820;
				var previewWidth = right - left - (menuWidth + contentWidth);
				var previewUnderlay = false;

				// If preview width is less than the minimum size, take some off the menu
				if (previewWidth < prefPreviewWidth) {
					menuWidth = minMenuWidth;
					previewWidth = right - left - (menuWidth + contentWidth);

					if (previewWidth < minPreviewWidth) {
						menuWidth = 150;
						contentWidth = right - left - menuWidth;
						previewWidth = right - left - menuWidth;
						previewUnderlay = true;

						if (contentWidth < 820) {
							menuWidth = minMenuWidth;
							contentWidth = right - left - menuWidth;
							previewWidth = right - left - menuWidth;
						}
					}
				}

				else if (previewWidth > 820) {
					contentWidth = (right - left - menuWidth) / 2;
					previewWidth = right - left - (menuWidth + contentWidth);
				}
			}

			menu.bounds({'x': left, 'y': top, 'height': bottom - top, 'width': menuWidth});
			menu.doLayout();
			left += menuWidth;

			content.bounds({'x': left, 'y': top, 'height': bottom - top, 'width': contentWidth});
			content.item.css({display: contentHidden ? 'none' : 'block'});
			content.doLayout();
			if (!previewUnderlay) left += contentWidth;

			preview.bounds({'x': left, 'y': top, 'height': bottom - top, 'width': previewWidth});
			preview.doLayout();


			return container;
		};

		function typeLayout(type) {
			var func = type + 'Size';

			return function (container) {
				var menuSize = menu[func](), contentSize = content[func](), previewSize = preview[func](), insets = container.insets();

				width = menuSize.width + contentSize.width + previewSize.width;
				height = Math.max(menuSize.height, contentSize.height, previewSize.height);

				return {
					'width': insets.left + insets.right + width,
					'height': insets.top + insets.bottom + height
				};
			};
		}

		obj.preferred = typeLayout('preferred');
		obj.minimum = typeLayout('minimum');
		obj.maximum = typeLayout('maximum');
		return obj;
	};

}(jQuery));