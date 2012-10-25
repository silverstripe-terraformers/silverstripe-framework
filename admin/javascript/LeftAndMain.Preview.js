(function($) {
	$.entwine('ss', function($){

		/**
		 * Shows a previewable website state alongside its editable version in backend UI, 
		 * typically a page. This allows CMS users to seamlessly switch between preview and 
		 * edit mode in the same browser window. The preview panel is embedded in the layout 
		 * of the backend UI, and loads its content via an iframe.
		 * 
		 * The admin UI itself is collapsible, leaving most screen space to this panel.
		 *
		 * Relies on the server responses to indicate if a preview URL is available for the 
		 * currently loaded admin interface. If no preview is available, the panel is "blocked"
		 * automatically.
		 * 
		 * Internal links within the preview iframe trigger a refresh of the admin panel as well,
		 * while all external links are disabled (via JavaScript).
		 */
		$('.cms-preview').entwine({
			
			// Minimum width to keep the CMS operational
			SharedWidth: null,
			
			onadd: function() {
				var self = this, layoutContainer = this.parent();
				// this.resizable({
				// 	handles: 'w',
				// 	stop: function(e, ui) {
				// 		$('.cms-container').layout({resize: false});
				// 	}
				// });
				
				// TODO Compute dynamically
				this.setSharedWidth(500);
				
				// Create layout and controls
				this.find('iframe').addClass('center');
				this.find('iframe').bind('load', function() {
					self._fixIframeLinks();

					// Load edit view for new page, but only if the preview is activated at the moment.
					// This avoids e.g. force-redirections of the edit view on RedirectorPage instances.
					self.loadCurrentPage();
				});
				
				this.data('cms-preview-initialized', true);
				
				// Preview might not be available in all admin interfaces - block/disable when necessary
				this.append('<div class="cms-preview-overlay ui-widget-overlay-light"></div>');
				this.find('.cms-preview-overlay-light').hide();
				$('.cms-preview-toggle-link')[this.canPreview() ? 'show' : 'hide']();

				self._fixIframeLinks();
				this.updatePreview();

				this._super();
			},

			loadUrl: function(url) {
				this.find('iframe').attr('src', url);
			},

			updatePreview: function() {
				var url = $('.cms-edit-form').choosePreviewLink();

				if(url) {
					this.loadUrl(url);
					this.unblock();
				} else {
					this.block();
				}
			},

			updateAfterXhr: function(){
				$('.cms-preview-toggle-link')[this.canPreview() ? 'show' : 'hide']();
				this.updatePreview();
			},

			'from .cms-container': {
				onaftersubmitform: function(){
					this.updateAfterXhr();
				},
				onafterstatechange: function(){
					this.updateAfterXhr();
				}
			},

			/**
			 * Loads the matching edit form for a page viewed in the preview iframe,
			 * based on metadata sent along with this document.
			 */
			loadCurrentPage: function() {
				var doc = this.find('iframe')[0].contentDocument, containerEl = this.getLayoutContainer();

				if(!this.canPreview()) return;

				// Load this page in the admin interface if appropriate
				var id = $(doc).find('meta[name=x-page-id]').attr('content'); 
				var editLink = $(doc).find('meta[name=x-cms-edit-link]').attr('content');
				var contentPanel = $('.cms-content');
				
				if(id && contentPanel.find(':input[name=ID]').val() != id) {
					// Ignore behaviour without history support (as we need ajax loading 
					// for the new form to load in the background)
					if(window.History.enabled) 
						$('.cms-container').loadPanel(editLink);
				}
			},

			/**
			 * Determines if the current interface is capable of previewing its managed record.
			 *
			 * Returns: {boolean}
			 */
			canPreview: function() {
				var contentEl = this.getLayoutContainer().find('.cms-content');
				// Only load if we're in the "edit page" view
				var blockedClasses = ['CMSPagesController', 'CMSPageHistoryController'];
				return !(contentEl.is('.' + blockedClasses.join(',.')));
			},
			
			_fixIframeLinks: function() {
				var doc = this.find('iframe')[0].contentDocument;
				if(!doc) return;

				// Block outside links from going anywhere
				var links = doc.getElementsByTagName('A');
				for (var i = 0; i < links.length; i++) {
					var href = links[i].getAttribute('href');
					if(!href) continue;
					
					// Open external links in new window to avoid "escaping" the
					// internal page context in the preview iframe,
					// which is important to stay in for the CMS logic.
					if (href.match(/^http:\/\//)) links[i].setAttribute('target', '_blank');
				}

				// Hide duplicate navigator, as it replicates existing UI in the CMS
				var navi = doc.getElementById('SilverStripeNavigator');
				if(navi) navi.style.display = 'none';
				var naviMsg = doc.getElementById('SilverStripeNavigatorMessage');
				if(naviMsg) naviMsg.style.display = 'none';
			},

			block: function() {
				this.addClass('blocked');
			},
			
			unblock: function() {
				this.removeClass('blocked');
			},
			
			getLayoutContainer: function() {
				return this.parents('.cms-container');
			},
			
			redraw: function() {
				if(window.debug) console.log('redraw', this.attr('class'), this.get(0));
			}
		});
		
		$('.cms-preview.collapsed').entwine({
			onmatch: function() {
				this.find('a').text('<');
				this._super();
			},
			onunmatch: function() {
				this._super();
			}
		});
		
		$('.cms-preview.blocked').entwine({
			onmatch: function() {
				this.find('.cms-preview-overlay').show();
				this._super();
			},
			onunmatch: function() {
				this.find('.cms-preview-overlay').hide();
				this._super();
			}
		});
		
		$('.cms-preview.expanded').entwine({
			onmatch: function() {
				this.find('a').text('>');
				this._super();
			},
			onunmatch: function() {
				this._super();
			}
		});
		
		$('.cms-switch-view a').entwine({
			onclick: function(e) {
				e.preventDefault();
				var preview = $('.cms-preview');
				preview.loadUrl($(e.target).attr('href'));
			}
		});
		
		$('.cms-preview .cms-preview-states').entwine({
			onmatch: function() {
				this.find('a').addClass('disabled');
				this.find('.active a').removeClass('disabled');
				this.find('.cms-preview-watermark').show();
				this.find('.active .cms-preview-watermark').hide();
				this._super();
			},
			onunmatch: function() {
				this._super();
			}
		});

		$('.cms-preview .cms-preview-states a').entwine({
			onclick: function(e) {
				e.preventDefault();
				this.parents('.cms-preview').loadUrl(this.attr('href'));
				this.addClass('disabled');
				this.parents('.cms-preview-states').find('a').not(this).removeClass('disabled');
				//This hides all watermarks
				this.parents('.cms-preview-states').find('.cms-preview-watermark').hide();
				//Show the watermark for the current state
				this.siblings('.cms-preview-watermark').show();
			}
		});

		$('.cms-preview-toggle-link').entwine({
			onclick: function(e) {
				e.preventDefault();

				var content = $('.cms-content');
				content.toggleClass('is-collapsed');
				content.parent().redraw();
			}
		});

		$('.cms-edit-form').entwine({
			/**
			 * Choose applicable preview link based on form data,
			 * in a fixed order of priority: The PreviewURL field is used as an override,
			 * which falls back to stage or live URLs.
			 *
			 * @return String Absolute URL
			 */
			choosePreviewLink: function() {
				var self = this, urls = $.map(['PreviewURL', 'StageLink', 'LiveLink'], function(name) {
					var val = self.find(':input[name=' + name + ']').val();
					return val ? val : null;
				});
				return urls ? urls[0] : false;
			}
		});

	});
}(jQuery));