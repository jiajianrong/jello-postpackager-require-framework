#jello-postpackager-require-framework
******
* 58金融事业部基于jello vm所编写的插件，依赖提前加载
* `fis.config.set('modules.postpackager', 'require-framework');`

#Important#

jr8系统使用本插件v2.2.0

f8系统使用v4.0.0及以上

v4.0.0对原有依赖加载功能做出重大升级，`<script src='mod-id'>`标签升级为`require(['mod-id'])`模式。进而结合页面定制化`requireJS`启用`localstroage`加载策略