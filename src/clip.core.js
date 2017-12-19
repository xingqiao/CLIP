/**
 * @fileOverview 图像截取组件
 * @author ctchen
 * @version 1.0.0
 *
 * 命名规范
 *  以两个下划线开头的为 private，不允许外部访问
 *  一个下划线开头的为 protected，只能在内部或者插件中访问
 *  其他为 public
 */

(function (win, doc) {
    var body = doc.body;

    // 工具方法库
    var utils = {
        touch: "ontouchend" in doc ? true : false,
        $: function (s, p, fun) {
            var func = fun || "querySelector";
            return p && p[func] ? p[func](s) : doc[func](s);
        },
        $$: function (s, p) {
            return this.$(s, p, "querySelectorAll");
        },
        /**
         * 设置transform
         */
        transform: function (elem, x, y, scale) {
            x = parseInt(x);
            y = parseInt(y);
            elem.style.transformOrigin = elem.style.webkitTransformOrigin = x + "px " + y + "px";
            elem.style.transform = elem.style.webkitTransform = "translate(" + (-x) + "px," + (-y) + "px) scale(" + scale + ")";
        },
        /**
         * 兼容 touchstart 和 mousedown
         */
        ondown: function (elem, callback) {
            if (utils.touch) {
                elem.addEventListener("touchstart", callback);
            } else {
                elem.addEventListener("mousedown", function (e) {
                    e.touches = [{
                        pageX: e.pageX,
                        pageY: e.pageY
                    }];
                    callback.call(this, e);
                });
            }
            return this;
        },
        /**
         * 兼容 touchmove 和 mousemove
         */
        onmove: function (elem, callback) {
            if (utils.touch) {
                elem.addEventListener("touchmove", callback);
            } else {
                elem.addEventListener("mousemove", function (e) {
                    e.touches = [{
                        pageX: e.pageX,
                        pageY: e.pageY
                    }];
                    callback.call(this, e);
                });
            }
            return this;
        },
        /**
         * 兼容 touchend 和 mouseup
         */
        onup: function (elem, callback) {
            if (utils.touch) {
                elem.addEventListener("touchend", callback);
                elem.addEventListener("touchcancel", callback);
            } else {
                elem.addEventListener("mouseup", callback);
            }
            return this;
        },
        /**
         * tap点击
         */
        ontap: function (elem, callback) {
            if (utils.touch) {
                var x1 = null, y1 = null, x2 = null, y2 = null;
                elem.addEventListener("touchstart", function (e) {
                    if (e.touches.length == 1) {
                        x1 = x2 = e.touches[0].pageX;
                        y1 = y2 = e.touches[0].pageY;
                    }
                });
                elem.addEventListener("touchmove", function (e) {
                    if (x1 != null) {
                        x2 = e.touches[0].pageX;
                        y2 = e.touches[0].pageY;
                    }
                });
                elem.addEventListener("touchend", function () {
                    if (Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) < 400) {
                        callback.call(elem);
                    }
                    x1 = null;
                });
            } else {
                elem.addEventListener("click", callback);
            }
            return this;
        },
        /**
         * 扩展对象
         */
        extend: function () {
            var options, name, src, copy, copyIsArray, clone,
                args = arguments,
                target = args[0] || {},
                i = 1,
                length = args.length,
                deep = false;

            if (utils.isBoolean(target)) {
                deep = target;
                target = args[i] || {};
                i++;
            }

            if (!utils.isObject(target) && !utils.isFunction(target)) {
                target = {};
            }

            if (i === length) {
                target = this;
                i--;
            }

            for (; i < length; i++) {
                if ((options = args[i]) != null) {
                    for (name in options) {
                        src = target[name];
                        copy = options[name];
                        if (target === copy) {
                            continue;
                        }
                        if (deep && copy && (jQuery.isPlainObject(copy) ||
                            (copyIsArray = Array.isArray(copy)))) {
                            if (copyIsArray) {
                                copyIsArray = false;
                                clone = src && Array.isArray(src) ? src : [];

                            } else {
                                clone = src && jQuery.isPlainObject(src) ? src : {};
                            }
                            target[name] = jQuery.extend(deep, clone, copy);
                        } else if (copy !== undefined) {
                            target[name] = copy;
                        }
                    }
                }
            }

            // Return the modified object
            return target;
        }
    };
    Array.prototype.forEach.call(["Object", "Function", "String", "Number", "Array", "Boolean", "File", { type: "Img", key: "HTMLImageElement" }, { type: "Canvas", key: "HTMLCanvasElement" }], function (item) {
        utils["is" + (item.type || item)] = function (obj) {
            return Object.prototype.toString.call(obj) === "[object " + (item.key || item) + "]";
        };
    });

    /**
     * 播放器核心类
     * @class CLIP
     * @example new CLIP({shape: CLIP.SHAPE.SQUARE})
     */
    class CLIP {
        // ================================ 静态方法 ================================

        /**
         * 创建canvas
         * @param {Number} width canvas宽度
         * @param {Number} height canvas高度
         * @return HTMLCanvasElement
         * @static
         */
        static createCanvas(width, height) {
            var canvas = doc.createElement("canvas");
            if (width > 0) {
                canvas.width = width;
            }
            if (height > 0) {
                canvas.height = height;
            }
            return canvas;
        }

        /**
         * 加载图片到canvas
         * @param {HTMLCanvasElement} canvas 画布
         * @param {Image} img 要绘制的图片
         * @static
         */
        static loadImgToCanvas(canvas, img) {
            var ctx = canvas.getContext("2d");
            var width = canvas.width = img.width;
            var height = canvas.height = img.height;
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0);
        }

        /**
         * 获取文件的blob链接
         * @param {File} file 要解析的图片文件
         * @param {Function} callback 回调函数(error, url)
         * @static
         */
        static getFileUrl(file, callback) {
            // 先采用 URL 的方式读取，不支持 URL 时采用 FileReader
            if (utils.isFunction(callback)) {
                if (utils.isFile(file)) {
                    var url;
                    if (win.URL) {
                        try {
                            url = URL.createObjectURL(file);
                        } catch (error) { }
                    }
                    if (url) {
                        callback(null, url);
                    } else {
                        try {
                            var reader = new FileReader();
                            reader.onload = function () {
                                callback(null, this.result);
                            };
                            reader.onerror = callback;
                            reader.readAsDataURL(file);
                        } catch (error) {
                            callback(error);
                        }
                    }
                } else {
                    callback();
                }
            }
        }

        /**
         * 构造函数
         * @constructor
         * @param {Object} opts 初始化参数
         * @param {String} opts.background 裁剪出图片的背景色，默认为透明，保存成jpg时默认为白色
         * @param {String} opts.shape 裁剪形状，值在 CLIP.SHAPE 中定义，默认是正方形
         * @param {String} opts.type 保存的图片类型，默认是 image/png，值在 CLIP.TYPE 中定义
         * @param {String} opts.rectRatio 矩形裁剪形状宽高比，当 type=CLIP.SHAPE.RECT 时有效，值为 宽:高，默认为 1
         * @param {Number} opts.quality 保存的jpg图片质量，type=image/jpeg 时有效，有效值0~1
         * @param {Number} opts.width 保存图片的宽度，不传该值时根据height的值等比缩放
         * @param {Number} opts.height 保存图片的高度，不传该值时根据width的值等比缩放
         */
        constructor(opts) {
            this._initData(opts);
        }

        // ================================ private ================================

        /**
         * 事件在图片开始加载时触发
         * @private
         */
        __loadingHandler() {
            var self = this;
            var __ = self.__;
            __.state.load = CLIP.STATE.LOADING;
            self._showLayer("loading");
        }

        /**
         * 事件在图片加载完成时触发
         * @private
         */
        __loadHandler() {
            var self = this;
            var __ = self.__;
            __.state.load = CLIP.STATE.LOADED;
            self.reset();
            if (__.state.show) {
                var iDoc = __.iframe.contentDocument;
                utils.$(".js_clip_save", iDoc).className = "js_clip_save";
                self._hideLayer();
            }
        }

        /**
         * 事件在打开裁剪弹窗时触发
         * @private
         */
        __showHandler() {
            var self = this;
            var __ = self.__;

            if (__.state.load == CLIP.STATE.LOADING) { // 正在加载中
                self._showLayer("loading");
            } else if (__.state.load != CLIP.STATE.LOADED) { // 未加载图片
                self._showLayer("empty");
            } else { // 加载完成
                var iDoc = __.iframe.contentDocument;
                utils.$(".js_clip_save", iDoc).className = "js_clip_save";
            }
        }

        /**
         * 事件在关闭裁剪弹窗时触发
         * @private
         */
        __hideHandler() {
        }

        /**
         * 事件在裁剪完成时触发
         * @private
         */
        __saveHandler() {
        }

        /**
         * 事件在执行出错时触发
         * @private
         */
        __errorHandler(error) {
            var self = this;
            var __ = self.__;
            if (!error.message) {
                switch (error.code) {
                    case CLIP.ERROR.LOAD_IMG_FAIL:
                        error.message = "加载图片失败";
                        break;
                    case CLIP.ERROR.SAVE_IMG_FAIL:
                        error.message = "保存图片失败";
                        break;
                    case CLIP.ERROR.OPEN_FILE_FAIL:
                        error.message = "读取文件失败";
                        break;
                }
            }
            __.state.error = error;
            self._showLayer("error", error);
        }

        // =========================================================================


        // ================================ protected ==============================

        /**
         * 派发事件
         * @param {String} evt 事件名
         * @param {Object} args 跟随事件传递的信息
         * @protected
         */
        _trigger(evt, args) {
            var self = this;
            if (evt && utils.isString(evt)) {
                // 触发内部定义的事件处理逻辑
                var handler = self["__" + evt + "Handler"];
                handler && handler.call(self, args);

                // 触发外部绑定的事件
                handler = self.__.opts["on" + evt.toLowerCase()]; // 首字母大写
                utils.isFunction(handler) && handler.call(self, args);
            }
            return self;
        }

        /**
         * 展示提示浮层
         * @param {String} type 浮层类型
         * @param {Object} data 附加信息
         * @protected
         */
        _showLayer(type, msg) {
            var self = this;
            var __ = self.__;
            if (__.state.show) {
                var iDoc = __.iframe.contentDocument;
                var icon;
                switch (type) {
                    case "loading":
                        icon = "loading";
                        msg = "正在加载中";
                        break;
                    case "error":
                        icon = "error";
                        msg = msg && msg.message || "操作失败";
                        break;
                    case "empty":
                        icon = "file";
                        msg = "选择文件";
                        break;
                }
                if (icon) {
                    if (!msg) {
                        msg = "";
                    }
                    var layer = utils.$(".js_layer", iDoc);
                    layer.innerHTML = `<div class="laver-wrap"><svg class="clip-icon"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon_${icon}"></use></svg><span>${msg}</span></div>`;
                    layer.setAttribute("data-type", type);
                    layer.style.display = "";
                }
            }
            return self;
        }

        /**
         * 隐藏提示浮层
         * @param {String} type 浮层类型
         * @param {Object} data 附加信息
         * @protected
         */
        _hideLayer() {
            var self = this;
            var __ = self.__;
            if (__.state.show) {
                var iDoc = __.iframe.contentDocument;
                utils.$(".js_layer", iDoc).style.display = "none";
            }
            return self;
        }

        /**
         * 设置裁剪区域路径
         * @param {HTMLCanvasElement} canvas
         * @param {Boolean} draw 是否绘制
         * @protected
         */
        _setClipShapePath(canvas, draw) {
            var self = this;
            var __ = self.__;
            var { opts, view } = __;
            var width = canvas.width;
            var height = canvas.height;
            var ctx = canvas.getContext("2d");

            // 有效区域大小
            var size = Math.min(width, height);
            var left = Math.max(0, parseInt((width - size) / 2));
            var top = Math.max(0, parseInt((height - size) / 2));
            var right = left + size;
            var bottom = top + size;
            if (draw) {
                if (opts.shape == CLIP.SHAPE.RECT && opts.rectRatio > 0) {
                    var _s = opts.rectRatio;
                    if (_s > 1) {
                        _s = size * (_s - 1) / (2 * _s);
                        top = parseInt(top + _s);
                        bottom = parseInt(bottom - _s);
                    } else {
                        _s = size * (1 - _s) / 2
                        left = parseInt(left + _s);
                        right = parseInt(right - _s);
                    }
                }
                view.size = size;
                view.left = left;
                view.top = top;
                view.right = right;
                view.bottom = bottom;
            }

            // 清空画布
            if (draw) {
                ctx.save();
                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = "rgba(0,0,0,.7)";
                ctx.fillRect(0, 0, width, height);
            }

            // 计算路径
            ctx.beginPath();
            if (opts.shape == CLIP.SHAPE.CIRCLE) { // 圆形
                ctx.arc(parseInt(width / 2), parseInt(height / 2), parseInt(size / 2), 0, 2 * Math.PI);
            } else { // 正方形 & 矩形
                ctx.rect(left, top, right - left, bottom - top);
            }
            ctx.closePath();

            // 绘制裁剪框
            if (draw) {
                ctx.clip();
                ctx.clearRect(0, 0, width, height);
                ctx.strokeStyle = "#fff";
                ctx.stroke();
                ctx.restore();
            }

            return self;
        }

        /**
         * 设初始化数据
         * @param {Object} opts 初始化参数
         * @protected
         */
        _initData(opts) {
            var self = this;

            var isShow = 0;
            if (self.__ && self.__.state && self.__.state.show) {
                isShow = 1;
                self.hide();
            }

            // 用来放一些私有属性
            var __ = {
                opts: {}, // 初始化参数
                state: { // 状态
                    error: 0, // 是否出错
                    load: 0, // 加载图片
                    show: 0 // 展示弹窗
                },
                canvas: CLIP.createCanvas(), // 缓存图像数据用
                iframe: null, // 浮层dom节点
                content: "", // 浮层html
                width: 0, // 图片高度
                height: 0, // 图片宽度
                view: { // 操作区
                    canvas: CLIP.createCanvas(), // 裁剪框展示用
                    width: 0,
                    height: 0,
                    size: 0,
                    btnsHeight: 54, // 底部按钮栏高度
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0
                },
                transform: { // 裁剪框中展示的图片的缩放
                    x: 0,
                    y: 0,
                    scale: 1
                },
                random: parseInt(Math.random() * 100000), // 随机数，用于避免图片缓存
                result: { // 裁剪结果
                    type: "",
                    quality: null,
                    data: "",
                    width: 0,
                    height: 0
                }
            };
            self.__ = __;

            // 初始化参数
            for (var key in CLIP.defaultOptions) {
                __.opts[key] = CLIP.defaultOptions[key];
            }
            if (utils.isObject(opts)) {
                for (var key in opts) {
                    if (/^on\w/.test(key) && utils.isFunction(opts[key])) {
                        __.opts[key.toLowerCase()] = opts[key];
                    } else {
                        __.opts[key] = opts[key];
                    }
                }
            }

            // 重置裁剪弹窗状态
            if (isShow) {
                self.show();
            }

            return self;
        }

        /**
         * 初始化裁剪框
         * @protected
         */
        _initDlg() {
            var self = this;
            var __ = self.__;
            var opts = __.opts;
            var view = __.view;
            var iframe = __.iframe;
            var content = __.content;
            var transform = __.transform;

            // 初始化iframe
            if (!iframe) {
                // 裁剪弹窗
                iframe = doc.createElement("iframe");
                iframe.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;border:0;z-index:99999";
                content = `<style>
                    body{margin:0;font:16px/1.5 sans-serif}
                    a,a:hover{text-decoration:none}
                    .clip,.layer{display:-webkit-box;display:flex;position:fixed;top:0;left:0;right:0;bottom:0;background-color:#000;}
                    .clip{-webkit-box-orient:vertical;flex-direction:column}
                    .clip-cont{position:relative;-webkit-box-flex:1;flex:1;overflow:hidden}
                    .clip-cont>*{position:absolute;left:0;top:0;}
                    .clip-btns{display:-webkit-box;display:flex;width:100%;height:${view.btnsHeight}px;background:rgba(255,255,255,.1)}
                    .clip-btns>*{display:block;padding:15px 0;width:50%;font-size:16px;color:#fff;text-align:center}
                    .clip-btns>*:first-child{opacity:.7}
                    .clip-icon{display:inline-block;width:32px;height:32px;fill:#fff;}
                    .layer{-webkit-box-pack:center;-webkit-box-align:center;align-items:center;background:rgba(0,0,0,.5);color:#fff;line-height:50px;}
                    .laver-wrap{width:100%;text-align:center}
                    .laver-wrap>*{vertical-align:middle;}
                    .laver-wrap svg{margin-right:5px;}
                    .disable{opacity:.4}
                    </style>
                    <svg style="display:none;" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <symbol id="icon_loading" viewBox="0 0 50 50">
                                <path d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z">
                                    <animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"/>
                                </path>
                            </symbol>
                            <symbol id="icon_error" viewBox="0 0 32 32">
                                <path d="M18.086 20.232c0.083 0.090 0.133 0.21 0.133 0.342 0 0.279-0.226 0.505-0.505 0.505-0.154 0-0.292-0.069-0.385-0.177l-0.001 0.001c-0.003-0.004-0.006-0.008-0.009-0.013-0.007-0.009-0.014-0.018-0.021-0.028-0.52-0.688-1.346-1.132-2.275-1.132-0.898 0-1.699 0.415-2.222 1.064-0.085 0.165-0.257 0.278-0.455 0.278-0.283 0-0.511-0.229-0.511-0.512 0-0.144 0.059-0.273 0.155-0.366 0.697-0.913 1.796-1.503 3.034-1.503 1.254 0 2.367 0.606 3.062 1.541zM17.2 25.72v0h8.52c0.414 0 0.748-0.335 0.748-0.747v-17.945c0-0.414-0.335-0.747-0.748-0.747h-21.382c-0.414 0-0.748 0.335-0.748 0.747v17.945c0 0.414 0.335 0.747 0.748 0.747h8.376l1.199 1.046 1.030 0h-1.029l1.2 1.047 1.117-1.047-0.96-0h0.961l1.116-1.046h-0.146zM17.495 26.766l-1.944 1.833c-0.24 0.227-0.635 0.234-0.884 0.016l-2.104-1.848h-8.524c-0.827 0-1.497-0.668-1.497-1.495v-18.543c0-0.826 0.67-1.495 1.497-1.495h21.979c0.827 0 1.497 0.668 1.497 1.495v18.543c0 0.826-0.67 1.495-1.497 1.495h-8.522zM27.514 24.822v-1.047h0.149c0.414 0 0.748-0.335 0.748-0.747v-17.945c0-0.414-0.335-0.747-0.748-0.747h-21.382c-0.414 0-0.748 0.335-0.748 0.747v0.15h-1.047v-0.449c0-0.826 0.67-1.495 1.497-1.495h21.979c0.827 0 1.497 0.668 1.497 1.495v18.543c0 0.826-0.67 1.495-1.497 1.495h-0.447zM21.533 11.364l0.748 0.73-1.794 1.991 1.794 1.938-0.748 0.724-2.393-2.672 2.393-2.712zM8.374 11.364l2.393 2.712-2.393 2.672-0.748-0.724 1.794-1.938-1.794-1.991 0.748-0.73z"></path>
                            </symbol>
                            <symbol id="icon_file" viewBox="0 0 15 15">
                                <path d="M14.969,0.031 L5,0.031 L5,2.969 L6,2.969 L6,1 L14.027,1 L14.027,8.001 L11,8.001 L11,10.952 L14.969,10.952 L14.969,0.031 Z" class="si-glyph-fill"></path>
                                <path d="M0,4 L0,15 L10,15 L10,4 L0,4 L0,4 Z M8.967,12 L0.967,12 L0.967,5 L8.967,5 L8.967,12 L8.967,12 Z" class="si-glyph-fill"></path>
                            </symbol>
                        </defs>
                    </svg>
                    <div class="clip js_clip">
                        <div class="clip-cont">
                            <div class="js_clip_pic"></div>
                            <canvas class="clip-cover js_clip_cover"></canvas>
                            <div class="layer js_layer" style="display:none"></div>
                        </div>
                        <div class="clip-btns">
                            <a class="js_clip_cancel" href="javascript:;">取消</a>
                            <a class="js_clip_save disable" href="javascript:;">选取</a>
                        </div>
                    </div>`;
                __.iframe = iframe;
                __.content = content;
            }
            doc.body.appendChild(iframe);
            var iDoc = iframe.contentDocument;
            iDoc.write(content);
            iDoc.close();

            // 获取操作区大小
            var width = parseInt(win.innerWidth);
            var height = parseInt(win.innerHeight - view.btnsHeight);
            view.width = width;
            view.height = height;

            // 绘制裁剪框
            var cover = utils.$(".js_clip_cover", iDoc);
            cover.width = width;
            cover.height = height;
            self._setClipShapePath(cover, true);

            // canvas
            var canvas = view.canvas;
            utils.$(".js_clip_pic", iDoc).appendChild(canvas);

            // 裁剪框操作
            var pos;
            var ontouch = 0;
            var setTransform = function (x, y, scale) {
                var width = __.width;
                var height = __.height;

                // 裁剪框有效区域映射到图片的位置
                var left = view.left / scale;
                var top = view.top / scale;
                var right = view.right / scale;
                var bottom = view.bottom / scale;

                // 尝试移动覆盖整个截图窗口
                x = Math.min(Math.max(x, - left), width - right);
                y = Math.min(Math.max(y, - top), height - bottom);

                // 判断是否可以覆盖
                if (
                    (x >= - left) &&
                    (x <= width - right) &&
                    (y >= - top) &&
                    (y <= height - bottom)
                ) {
                    transform.x = x;
                    transform.y = y;
                    transform.scale = scale;
                    utils.transform(canvas, x, y, scale);
                }
            };

            utils
                // 平移及缩放
                .ondown(cover, function (e) {
                    if (__.state.show && __.state.load == CLIP.STATE.LOADED) {
                        ontouch = 1;
                        pos = [];
                        for (var i = 0, l = e.touches.length; i < l; i++) {
                            pos.push({ x: e.touches[i].pageX, y: e.touches[i].pageY });
                        }
                    }
                    e.preventDefault();
                    e.stopPropagation();
                })
                .onmove(cover, function (e) {
                    if (ontouch) {
                        var width = __.width;
                        var height = __.height;
                        var size = view.size;
                        var x, y, x2, y2;
                        var scale = transform.scale;
                        var x1 = e.touches[0].pageX;
                        var y1 = e.touches[0].pageY;

                        if (e.touches.length == 2 && pos.length == 2) { // 缩放
                            x2 = e.touches[1].pageX;
                            y2 = e.touches[1].pageY;
                            var cx = (pos[0].x + pos[1].x) / 2;
                            var cy = (pos[0].y + pos[1].y) / 2;

                            // 双指距离改变量
                            var l1 = Math.sqrt(Math.pow(pos[1].x - pos[0].x, 2) + Math.pow(pos[1].y - pos[0].y, 2));
                            var l2 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                            var sl = l2 / l1;

                            // 将绕 cx,cy 缩放转换成绕可视区域左上角缩放
                            scale = transform.scale * sl;
                            var ds = (sl - 1) / scale;
                            x = transform.x + cx * ds;
                            y = transform.y + cy * ds;
                        } else { // 平移
                            x = transform.x + (pos[0].x - x1) / scale;
                            y = transform.y + (pos[0].y - y1) / scale;
                        }

                        setTransform(x, y, scale);

                        pos[0].x = x1;
                        pos[0].y = y1;
                        if (pos.length == 2) {
                            pos[1].x = x2;
                            pos[1].y = y2;
                        }
                    }
                    e.preventDefault();
                    e.stopPropagation();
                })
                .onup(cover, function () {
                    ontouch = 0;
                })
                // 取消
                .ontap(utils.$(".js_clip_cancel", iDoc), function () {
                    self.hide("cancel");
                })
                // 裁剪
                .ontap(utils.$(".js_clip_save", iDoc), function () {
                    if (!/disable/.test(this.className)) {
                        self.save();
                    }
                })
                // 选择文件
                .ontap(utils.$(".js_layer", iDoc), function () {
                    if (this.getAttribute("data-type") == "empty") {
                        var input = utils.$("#file", iDoc);
                        if (!input) {
                            input = iDoc.createElement("input");
                            input.id = "file";
                            input.type = "file";
                            input.style.display = "none";
                            input.accept = "image/*";
                            iDoc.body.appendChild(input);
                            input.onchange = function () {
                                if (this.files[0]) {
                                    self.load(this.files[0]);
                                }
                            }
                        };
                        input.click();
                    }
                });
            // 滚轮缩放
            cover.addEventListener("mousewheel", function (e) {
                if (__.state.show && __.state.load == CLIP.STATE.LOADED) {
                    var scale = transform.scale * (e.deltaY > 0 ? 0.9 : 1 / 0.9);
                    var cx = e.clientX;
                    var cy = e.clientY;
                    var ds = scale - transform.scale;
                    var x = transform.x + cx * ds;
                    var y = transform.y + cy * ds;
                    setTransform(x, y, scale);
                }
                e.preventDefault();
                e.stopPropagation();
            });

            // 标记弹窗已打开
            __.state.show = 1;

            return self;
        }

        // =========================================================================


        // ================================ public =================================

        // 播放器方法

        /**
         * 加载图片
         * @param {Image|Canvas|File|String} img 图片标签或图片链接
         * @public
         */
        load(img) {
            var self = this;
            var __ = self.__;

            if (utils.isFile(img)) {
                CLIP.getFileUrl(img, function (error, url) {
                    if (error) {
                        self._trigger(error, CLIP.ERROR.OPEN_FILE_FAIL);
                    } else if (url) {
                        self.load(url);
                    }
                });
            } else {
                if (utils.isImg(img)) {
                    img = img.src;
                }

                var _load = function (img) {
                    CLIP.loadImgToCanvas(__.canvas, img);
                    __.width = img.width;
                    __.height = img.height;
                    self._trigger("load");
                };

                if (img && utils.isString(img)) {
                    self._trigger("loading");

                    var tmpImg = new Image();
                    tmpImg.crossOrigin = "anonymous";
                    tmpImg.onload = function () {
                        _load(tmpImg);
                    }
                    tmpImg.onerror = tmpImg.onabort = function () {
                        self._trigger("error", { code: CLIP.ERROR.LOAD_IMG_FAIL });
                    }
                    // 添加随机数，避免缓存
                    if (!/^(?:blob|data):/i.test(img)) {
                        img = img.split("#");
                        img[0] = (img[0] + "&_random=" + __.random).replace(/[?&]/, "?");
                        img = img.join("#");
                    }
                    tmpImg.src = img;
                } else if (utils.isCanvas(img)) {
                    _load(img);
                }
            }

            return self;
        }

        /**
         * 保存裁剪结果
         * @param {String} type 保存的图片类型，默认是 image/png，值在 CLIP.TYPE 中定义
         * @param {Number} quality 保存的jpg图片质量，type=image/jpeg 时有效，有效值0~1
         * @param {Function} callback 回掉函数，参数(error, imgData)
         * @public
         */
        save(type, quality, callback) {
            var self = this;
            var __ = self.__;
            var opts = __.opts;
            var view = __.view;
            var transform = __.transform;

            if (utils.isFunction(type)) {
                callback = type;
                type = quality = null;
            } else if (utils.isFunction(type)) {
                callback = quality;
                quality = null;
            }
            if (type == null) {
                type = opts.type;
            }
            if (quality == null) {
                quality = opts.quality;
            }

            var error, result;
            try {
                var scale = transform.scale;
                var width = parseInt((view.right - view.left) / scale);
                var height = parseInt((view.bottom - view.top) / scale);
                var x = parseInt(transform.x + view.left / scale);
                var y = parseInt(transform.y + view.top / scale);

                // 裁剪图片
                var canvas = CLIP.createCanvas(width, height);
                var ctx = canvas.getContext("2d");
                if (opts.background) {
                    ctx.fillStyle = opts.background;
                    ctx.fillRect(0, 0, width, height);
                }
                // 圆形需要做裁剪
                if (opts.shape == CLIP.SHAPE.CIRCLE) {
                    self._setClipShapePath(canvas);
                    ctx.clip();
                }
                ctx.drawImage(__.canvas, x, y, width, height, 0, 0, width, height);
                ///////////////////////////////////////
                console.log(x, y, width, height)
                // var result = document.querySelector(".js_result");
                // result.innerHTML = "";
                // var img = new Image();
                // img.src = canvas.toDataURL("image/jpeg");
                // document.body.appendChild(img);

                // 调整大小
                if (opts.width > 0 || opts.height > 0) {
                    var w = opts.width;
                    var h = opts.height;
                    if (!(w > 0)) {
                        w = h * width / height;
                    } else if (!(h > 0)) {
                        h = w * height / width;
                    }
                    width = w;
                    height = h;
                    var c = CLIP.createCanvas(width, height);
                    ctx = c.getContext("2d");
                    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, width, height);
                    canvas = c;
                }

                // 获取数据
                result = {
                    type: type,
                    quality: quality,
                    data: canvas.toDataURL(type, quality),
                    width: width,
                    height: height,
                };
                utils.extend(__.result, result);
            } catch (ex) {
                error = { code: CLIP.ERROR.LOAD_IMG_FAIL, error: ex };
            }

            if (error) {
                self._trigger("error", error);
            } else {
                self._trigger("save", result);
                self.hide("save");
            }

            if (utils.isFunction(callback)) {
                callback(error, result);
            }

            return self;
        }

        /**
         * 打开裁剪弹窗
         * @public
         */
        show() {
            var self = this;
            var __ = self.__;
            var opts = __.opts;

            if (__.state.show) {
                doc.body.removeChild(__.iframe);
                __.state.show = 0;
            }

            self
                ._initDlg() // 初始化裁剪框
                .reset() // 重置图片状态
                ._trigger("show");

            return self;
        }

        /**
         * 关闭裁剪弹窗
         * @param {String} type 触发关闭操作的来源，会透传给hide事件
         * @public
         */
        hide(type) {
            var self = this;
            var __ = self.__;
            if (__.state.show) {
                doc.body.removeChild(__.iframe);
                __.state.show = 0;
            }
            self._trigger("hide", type || "hide");
            return self;
        }

        /**
         * 重置图片缩放状态
         * @public
         */
        reset() {
            var self = this;
            var __ = self.__;
            var view = __.view;
            var transform = __.transform;
            if (__.state.show && __.state.load == CLIP.STATE.LOADED) {
                // 加载图像
                var canvas = view.canvas;
                var ctx = canvas.getContext("2d");
                canvas.width = __.width;
                canvas.height = __.height;
                ctx.clearRect(0, 0, __.width, __.height);
                ctx.drawImage(__.canvas, 0, 0);

                // 重置缩放
                var scale = 1,
                    x = 0,
                    y = 0;
                var sw = view.width / __.width;
                var sh = view.height / __.height;
                if (sw > sh) {
                    scale = sw;
                    y = parseInt((__.height - view.height / scale) / 2);
                } else {
                    scale = sh;
                    x = parseInt((__.width - view.width / scale) / 2);
                }
                transform.x = x;
                transform.y = y;
                transform.scale = scale;
                utils.transform(canvas, x, y, scale);
            }
            return self;
        }

        /**
         * 清空裁剪板
         * @public
         */
        clear() {
            return this._initData(this.__.opts);
        }

        /**
         * 设置或返回播放器高度
         */
        get result() {
            return utils.extend({}, this.__.result);
        }

        /**
         * 获取或设置保存图片的宽度设置
         */
        get width() {
            return this.__.opts.width;
        }
        set width(value) {
            if (value > 0) {
                this.__.opts.width = value;
            }
        }

        /**
         * 获取或设置保存图片的高度设置
         */
        get height() {
            return this.__.opts.height;
        }
        set height(value) {
            if (value > 0) {
                this.__.opts.height = value;
            }
        }

        // =========================================================================
    }

    win.CLIP = CLIP;
})(window, document);