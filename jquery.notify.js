/*!
 * jQuery Notify
 * Copyright (c) 2011 Massimo Iacolare
 * Dual licensed under the MIT license and GPL license
 * http://www.opensource.org/licenses/mit-license
 * http://www.gnu.org/licenses/gpl.txt
 * Dependencies: jquery 1.5
 */

/*
examples:
$.notify('.notification-bar', 'sticky', 'We have new coupons available to you. Be sure to check it out (insert a link)')
$.notify('', 'Oops, there's an error below. Please correct it and try again')
$.notify('tr', 'timed', 'Element removed')
 */

(function($) {

    var defaults = {
        position: 'tr' //tl, tc, tr, ml, mc, mr, bl, bc, br
      , width: 300
      , containerHeight: 200 //it's only used when you want to center vertically
      , type: 'timed' //sticky, human
      , timeout: '3000' //time (ms)
      , opacity: 0.8
      , vPos: function() { return this.position.substring(0, 1); }
      , hPos: function() { return this.position.substring(1, 2); }
    };

    var factory = function(options, content) {
        var obj = Object.create(notification);
        obj.init(options, content);
        return obj;
    };
    factory.containers = {};
    factory.positions = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'];
    $.notify = factory;

    var containerFactory = function(opts) {
        var elem = createElement(opts.position);
        if (elem.size() === 0) {
            throw 'There\s an error. The css selector "'+opts.position+'" ' +
                  'you specified as a position does not yield any results. ' +
                  'Are you sure you didn\'t mistype something?';
        }

        function push(notification) {
            elem.queue(function(next) {
                var self = this;
                
                add(notification).then(next)
            });
            elem.delay(700);
        }

        function add(notification) {
            return $.Deferred(function(dfd) {
                notification.element.hide();

                var appendMethod = opts.vPos() == 'b'? 'prepend' : 'append';
                elem[appendMethod](notification.element);

                notification.show().then(dfd.resolve);
            }).promise();
        }

        function pop(notification) {
            elem.queue(function(next) {
                var self = this;

                remove(notification).then(next)
            });
            elem.delay(700);
        }

        function remove(notification) {
            return $.Deferred(function(dfd) {

                notification.hide().then(function() {
                    //notification.element.remove();
                    //dfd.resolve();
                    
                    notification.element.delay(200).slideUp(200, function() {
                        notification.element.remove();
                        dfd.resolve();
                    });
                });
            }).promise();
        }

        function createElement(position) {
            if ($.inArray(position, factory.positions) === -1) return $(position);

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

        return {
            push: push,
            pop: pop
        };
    };

    var notification = {
        init: function(options, content) {
            this.opts = $.extend({}, defaults, options);
            this.element = this.createElement(content);
            this.container = this.getContainer();
            this.container.push(this);
        },

        getContainer: function() {
            factory.containers[this.opts.position] =
                    factory.containers[this.opts.position] ||
                    containerFactory(this.opts);

            return factory.containers[this.opts.position];
        },

        createElement: function(text) {
            var self = this
              , opts = this.opts
              , elem = $('<div class="nf-notification nf-'+opts.type+'"></div>').html(text);

            if (opts.type === 'sticky') {
                $('<div/>', {
                    className: 'nf-close-cmd'
                  , html: '[x]'
                  , click: function() { self.removeFromContainer(); }
                })
                .appendTo(elem);
            }

            return elem;
        },

        show: function() {
            var self = this
              , opts = this.opts;

            return $.Deferred(function (dfd) {
                self.element.slideToggle(400, dfd.resolve);
                //self.element.fadeToggle(400, dfd.resolve);

                /*self.element
                        .show()
                        .css({
                            left: 500
                        })
                        .animate({
                            left: 0
                        }, 1000, 'swing', dfd.resolve);*/
            })
            .promise()
            .then(function() {
                if (opts.type === 'timed') {
                    setTimeout(function() { self.removeFromContainer(); }, opts.timeout);
                }

                if (opts.type === 'human') {
                    setTimeout(function() {
                        $(window)
                            .bind('mousemove.notify', $.proxy(self, 'removeFromContainer'))
                            .bind('click.notify', $.proxy(self, 'removeFromContainer'))
                            .bind('keypress.notify', $.proxy(self, 'removeFromContainer'))
                    }, 700);
                }   
            });
        },

        hide: function() {
            var self = this
              , opts = this.opts;

            return $.Deferred(function(dfd) {
                //self.element.fadeOut(1000, function() { dfd.resolve(); });
                self.element.fadeTo(1000, 0, 'swing', function() { dfd.resolve(); });
            });
        },

        removeFromContainer: function() {
            var self = this;
            $(window)
                    .unbind('mousemove.notify', self.removeFromContainer)
                    .unbind('click.notify', self.removeFromContainer)
                    .unbind('keypress.notify', self.removeFromContainer)

            self.container.pop(this);
            //$(this).trigger('expired.notify');
        }
    };
    
})(jQuery);