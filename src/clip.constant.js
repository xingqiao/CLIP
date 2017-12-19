/**
 * @fileOverview 图像截取组件常量定义
 * @author ctchen
 * @version 1.0.0
 */

(function (CLIP) {
    /**
     * 错误类型
     */
    CLIP.ERROR = {
        /**
         * 加载图片失败
         */
        LOAD_IMG_FAIL: 1,

        /**
         * 保存图片失败
         */
        SAVE_IMG_FAIL: 2,

        /**
         * 读取文件失败
         */
        OPEN_FILE_FAIL: 3
    };

    /**
     * 状态
     */
    CLIP.STATE = {
        /**
         * 加载中
         */
        LOADING: 1,

        /**
         * 加载完成
         */
        LOADED: 2
    };

    /**
     * 裁剪形状
     */
    CLIP.SHAPE = {
        /**
         * 圆形
         */
        CIRCLE: "circle",

        /**
         * 正方形
         */
        SQUARE: "square",

        /**
         * 矩形
         */
        RECT: "rect"
    };

    /**
     * 保存的图片类型
     */
    CLIP.TYPE = {
        JPG: "image/jpeg",
        PNG: "image/png"
    };

    /**
     * 默认初始化参数
     */
    CLIP.defaultOptions = {
        /**
         * 裁剪出图片的背景色，默认为透明，保存成jpg时默认为白色
         */
        background: null,

        /**
         * 裁剪形状，默认是正方形，值在 CLIP.SHAPE 中定义
         */
        shape: CLIP.SHAPE.SQUARE,

        /**
         * 保存的图片类型，默认是 image/png，值在 CLIP.TYPE 中定义
         */
        type: CLIP.TYPE.PNG,

        /**
         * 矩形裁剪形状宽高比，当 type=CLIP.SHAPE.RECT 时有效，值为 宽:高
         */
        rectRatio: 1,

        /**
         * 保存的jpg图片质量，type=image/jpeg 时有效，有效值0~1
         */
        quality: "",

        /**
         * 保存图片的宽度，不传该值时根据height的值等比缩放
         */
        width: null,

        /**
         * 保存图片的高度，不传该值时根据width的值等比缩放
         */
        height: null
    };
})(window.CLIP);