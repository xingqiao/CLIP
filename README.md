# clip.js - 图像裁剪

## DEMO

<http://y.qq.com/m/demo/ctools/clip.html>

## GitHub

<https://github.com/xingqiao/CLIP/>

## 支持功能

- 支持解析图片、Canvas、文件、图片链接

- 支持裁剪成正方形、圆形、自定义矩形

- 支持缩放操作

- 支持保存成PNG/JPG

## 初始化

> 不依赖其他第三方库

```html
<script src="qmv.js"></script>
```

```javascript
var clip = new CLIP({
    shape: CLIP.SHAPE.SQUARE,
    onsave: function (result) {
        console.log(result);
    },
    onerror: function (e) {
        console.log("error", e);
    }
});
clip.load("./test.jpg").show();
```

## 初始化参数

| 参数 | 类型 | 默认值 | 描述 |
|-|-|-|-|
| background | String | null | 裁剪出图片的背景色，默认为透明，保存成jpg时默认为白色 |
| shape | String | "square" | 裁剪形状，值在 CLIP.SHAPE 中定义，默认是正方形 |
| rectRatio | Number | \- | 矩形裁剪形状宽高比，当 type=CLIP.SHAPE.RECT 时有效，值为 宽:高，默认为 1 |
| type | String | "image/png" | 保存的图片类型，默认是 image/png，值在 CLIP.TYPE 中定义 |
| quality | Number | \- | 保存的jpg图片质量，type=image/jpeg 时有效，有效值0~1 |
| width | Number | \- | 保存图片的宽度，不传该值时根据height的值等比缩放 |
| height | Number | \- | 保存图片的高度，不传该值时根据width的值等比缩放 |

## CLIP对象属性

| 属性名 | 类型 | 值 | 描述 |
|-|-|-|-|
| result | Object | \- | 返回base64链接形式的裁剪结果 |
| width | Number | \- | 获取或设置保存图片的宽度设置 |
| height | Number | \- | 获取或设置保存图片的高度设置 |

## CLIP对象方法

| 方法名 | 描述 |
|-|-|
| load | 加载图片 |
| save | 保存裁剪结果 |
| show | 打开裁剪弹窗 |
| hide | 关闭裁剪弹窗 |
| reset | 重置图片缩放状态 |
| clear | 清空裁剪板 |

## CLIP对象事件

| 事件名 | 描述 |
|-|-|
| loading | 事件在图片开始加载时触发 |
| load | 事件在图片加载完成时触发 |
| show | 事件在打开裁剪弹窗时触发 |
| hide | 事件在关闭裁剪弹窗时触发 |
| save | 事件在裁剪完成时触发 |
| error | 事件在执行出错时触发 |

## 常量定义

### 错误类型 CLIP.ERROR

| 常量 | 值 | 描述 |
|-|-|-|
| CLIP.ERROR.LOAD_IMG_FAIL | 1 | 加载图片失败 |
| CLIP.ERROR.SAVE_IMG_FAIL | 2 | 保存图片失败 |
| CLIP.ERROR.OPEN_FILE_FAIL | 3 | 读取文件失败 |

### 图片加载状态 CLIP.STATE

| 常量 | 值 | 描述 |
|-|-|-|
| CLIP.STATE.LOADING | 1 | 加载中 |
| CLIP.STATE.LOADED | 2 | 加载完成 |

### 裁剪形状 CLIP.SHAPE

| 常量 | 值 | 描述 |
|-|-|-|
| CLIP.SHAPE.CIRCLE | "circle" | 圆形 |
| CLIP.SHAPE.SQUARE | "square" | 正方形 |
| CLIP.SHAPE.RECT | "rect" | 正方形 |

### 保存的图片类型 CLIP.TYPE

| 常量 | 值 | 描述 |
|-|-|-|
| CLIP.TYPE.PNG | "image/png" | png |
| CLIP.TYPE.JPG | "image/jpeg" | jpg |
