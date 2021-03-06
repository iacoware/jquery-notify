/*!
 * jQuery Notify
 * Copyright (c) 2011 Massimo Iacolare
 * Dual licensed under the MIT license and GPL license
 * http://www.opensource.org/licenses/mit-license
 * http://www.gnu.org/licenses/gpl.txt
 * Dependencies: jquery 1.5
 */

(function($) {

    var defaults = {
        position: 'tr' //tl, tc, tr, ml, mc, mr, bl, bc, br
      , width: 300
      , containerHeight: 200 //it's only used when you want to center vertically
      , type: 'timed' //sticky, human
      , timeout: '5000' //time (ms)
      , opacity: 0.8
      , stickyTemplate: '[x]'
      , extraClass: 'nf-standard'
      , vPos: function() { return this.position.substring(0, 1); }
      , hPos: function() { return this.position.substring(1, 2); }
    };

    var factory = function(content, options) {
        function getContainer() {
            factory.containers[opts.position] = factory.containers[opts.position] || containerFactory(opts);
            return factory.containers[opts.position];
        }

        var opts = $.extend({}, defaults, options);
        var container = getContainer();
        var notification = notificationFactory(content || opts.content, opts);
        container.push(notification);
    	return notification;
    };
    factory.containers = {};
    factory.positions = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'];

    //export as a jQuery function
    $.notify = factory;

    var containerFactory = function(opts) {
        var notificationsCount = 0;
        var externalContainer = $.inArray(opts.position, factory.positions) === -1;
        var elem = createElement(opts.position);
        if (elem.size() === 0) {
            throw 'There\s an error. The css selector "'+opts.position+'" ' +
                  'you specified as a position does not yield any results. ' +
                  'Are you sure you didn\'t mistype something?';
        }

        function push(notification) {
            var self = this;

            elem.queue(function(next) {
                $(notification).bind('expired.notify', function() {
                    $(notification).unbind('expired.notify');
                    self.pop(notification);
                });
                add(notification).then(next)
            });
            elem.delay(200);
        }

        function add(notification) {
            return $.Deferred(function(dfd) {
                notification.element.hide();

                var appendMethod = opts.vPos() == 'b'? 'prepend' : 'append';
                elem[appendMethod](notification.element);
                notificationsCount++;

                notification.show().then(dfd.resolve);
            }).promise();
        }

        function pop(notification) {
            elem.queue(function(next) {
                var self = this;

                remove(notification).then(function() {
                    next();
                    if (notificationsCount === 0 && !externalContainer) {
                        destroy();
                    }
                });
            });
            elem.delay(700);
        }

        function remove(notification) {
            return $.Deferred(function(dfd) {
                notification.hide().then(function() {
                    notification.element.delay(200).slideUp(200, function() {
                        notification.element.remove();
                        notificationsCount--;
                        dfd.resolve();
                    });
                });
            }).promise();
        }

        function createElement(position) {
            if (externalContainer) return $(position);

            var element =  $('<div class="nf-container"/>').css({
                position: 'fixed'
              , width: opts.width
              , opacity: opts.opacity
            });

            var vpos = opts.vPos(), hpos = opts.hPos();
            if (vpos === 't') element.css('top', '0');
            if (vpos === 'm') element.css({top: '50%', marginTop: -opts.containerHeight/2, height: opts.containerHeight, overflow: 'auto'});
            if (vpos === 'b') element.css('bottom', '0');
            if (hpos === 'l') element.css('left', '0');
            if (hpos === 'c') element.css({left:'50%', marginLeft: -opts.width/2});
            if (hpos === 'r') element.css('right', '0');

            return (element.appendTo(document.body), element);
        }

        function destroy() {
            factory.containers[opts.position] = null;
            elem.remove();
        }

        return {
            push: push,
            pop: pop
        };
    };

    var notificationFactory = function(content, opts) {
        var createElement = function(content) {
            var elem = $('<div class="nf-notification nf-'+opts.type+' '+opts.extraClass+'"></div>').html(content);

            if (opts.type === 'sticky') {
                if (opts.stickyTemplate) {
                	$('<div/>', {
						'class': 'nf-close-cmd'
					  , html: opts.stickyTemplate
					}).appendTo(elem);
                }
            	
            	elem.click(function() { expire(); });
            }

            return elem;
        };

        var show = function() {
            return $.Deferred(function (dfd) {
                element.slideToggle(400, dfd.resolve);
                //element.fadeToggle(400, dfd.resolve);
            })
            .promise()
            .then(function() {
                if (opts.type === 'timed') {
                    setTimeout(function() { expire(); }, opts.timeout);
                }

                if (opts.type === 'human') {
                    setTimeout(function() {
                        $(window)
                            .bind('mousemove.notify', expire)
                            .bind('click.notify', expire)
                            .bind('keypress.notify', expire);
                    }, 700);
                }
            });
        };

        var hide = function() {
            return $.Deferred(function(dfd) {
                //element.fadeOut(1000, function() { dfd.resolve(); });
                element.fadeTo(1000, 0, 'swing', function() { dfd.resolve(); });
            });
        };

        var expire = function() {
        	$(window)
	        	.unbind('mousemove.notify', expire)
	        	.unbind('click.notify', expire)
	        	.unbind('keypress.notify', expire);

            $(instance).trigger('expired.notify');
        };

        var element = createElement(content);
        var instance = {};

    	instance.show = show;
    	instance.hide = hide;
    	instance.close = expire;
        instance.element = element;
        return instance;
    };
    
})(jQuery);
