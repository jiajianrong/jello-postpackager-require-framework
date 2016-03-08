'use strict';

module.exports = function (ret, conf, settings, opt) {

    var allRes = [];



    fis.util.map(ret.map.res, function(fileName, fileDetails) {
        var obj = {};

        obj.fileName = fileName;
        obj.fileUri = fileDetails.uri;
        obj.deps = fileDetails.deps;

        allRes.push(obj);
    });


    /**
     * allRes: array
     * 
        0: Object
        deps: Array[9]
        fileName: "page/car-apply/car-apply.js"
        fileUri: "/crm-m/static/page/car-apply/car-apply_4e6788d.js"
        
        1: Object
        deps: undefined
        fileName: "page/car-apply/car-apply.scss"
        fileUri: "/crm-m/static/page/car-apply/car-apply_9101db8.css"
        
        ...
     */

    // var stringify = JSON.stringify(all);



    function digui(jsName, allRes, rtnRes) {

        allRes.forEach(function(item) {

            if (item.fileName && item.fileName.indexOf(jsName) != -1) {

                var obj = {};

                obj.deps = item.deps || [];
                obj.fileUri = item.fileUri;

                obj.deps && obj.deps.length && obj.deps.forEach(function(item) {
                    digui(item + ".js", allRes, rtnRes);
                });

                // 一定保证digui调用在本句前面，依赖提前加载
                rtnRes.push(obj);

                return false;
            }

        });
    }


    function quchong(arr) {
        var rtnArr = [],
            tmpMap = {},
            itemUri;
        for (var i = 0; i < arr.length; i++) {
            itemUri = arr[i].fileUri;

            // 靠fileUri做map key值去重
            if (!tmpMap[itemUri]) {
                tmpMap[itemUri] = true;
                rtnArr.push(arr[i]);
            }
        }
        return rtnArr;
    }



    //再次遍历文件，找到isViews标记的文件
    //替换里面的__FRAMEWORK_CONFIG__钩子
    fis.util.map(ret.src, function(subpath, file) {
        //有isViews标记，并且是js或者html类文件，才需要做替换
        if (file.isViews && (file.isJsLike || file.isHtmlLike)) {

            // 当前view对应的js文件
            var jsName = file.id.replace(/\.vm/, '.js');

            // 为数组以保证依赖顺序
            var rtnRes = [];

            digui(jsName, allRes, rtnRes);


            rtnRes = quchong(rtnRes);


            var tmpRes = rtnRes.map(function(item) {
                return item.fileUri;
            });
            //console.log("\n\n" + jsName + " --requires--\n" + tmpRes.join("\n"));



            var stringify = "";

            rtnRes.forEach(function(item) {
                stringify += "<script src='" + item.fileUri + "'></script>\n    ";
            });

            var content = file.getContent();

            //替换文件内容
            content = content.replace(/\b__FRAMEWORK_CONFIG__\b/g, stringify);
            file.setContent(content);
        }
    });
};