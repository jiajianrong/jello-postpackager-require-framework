'use strict';

module.exports = function (ret, conf, settings, opt) {

    var allRes = [];
    
    createAllRes();
    
    
    /*************************
     * 创建 所有资源列表 allRes
     
     0: Object
        deps: Array[9]
        fileName: "page/car-apply/car-apply.js"
        fileUri: "/crm-m/static/page/car-apply/car-apply_4e6788d.js"
        
     1: Object
        deps: undefined
        fileName: "page/car-apply/car-apply.scss"
        fileUri: "/crm-m/static/page/car-apply/car-apply_9101db8.css"
     *************************/
    function createAllRes() {
        
        fis.util.map(ret.map.res, function(fileName, fileDetails) {
            var obj = {};
            
            obj.fileName = fileName;
            obj.fileUri = fileDetails.uri; // with md5
            
            // 2016-03-17 同步依赖分析
            obj.deps = fileDetails.deps;
            
            // 2016-03-15 异步依赖分析
            if (fileDetails.extras && fileDetails.extras.async) {
                obj.asyncDeps = fileDetails.extras.async; // array，包含自身
            }

            allRes.push(obj);
        });
        
    } 

       
    
    /*************************
     * 递归   rtnRes为arr
     *************************/
    function digui(jsName, rtnRes) {

        allRes.forEach(function(item) {

            // 命中该对象，分析依赖，装入rtnRes
            if (item.fileName && item.fileName.indexOf(jsName) != -1) {
                
                var obj = {};
                
                obj.fileUri = item.fileUri;

                // 同步依赖
                if (item.deps && item.deps.length) {
                
                    obj.deps = item.deps;
                    
                    item.deps.forEach(function(item) {
                        digui(item + ".js", rtnRes);
                    });
                }
                
                
                // 异步依赖
                if (item.asyncDeps && item.asyncDeps.length) {
                    
                    obj.asyncMap = {};
                    
                    item.asyncDeps.forEach(function(item) {
                        digui(item + ".js", obj.asyncMap[item] = []);
                    });
                }

                // 一定保证digui调用在本句前面，依赖提前加载
                rtnRes.push(obj);

                // 已命中，跳出递归
                return false;
            }

        });
    }
    
    
    
    /*************************
     * array去重
     *************************/
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
    
    
    
    /*************************
     * 异步资源去重：遍历同步资源，去掉命中
     *************************/
    function quchongAsync(arrAsync,arr) {
        
        var rtnArr = [];
        
        arrAsync.forEach(function(itemAsync){
            
            var flag = true; // true：同步资源里未命中当前异步资源
            
            for ( var i=0;i<arr.length;i++ ) {
                if (arr[i].fileUri && arr[i].fileUri.indexOf(itemAsync)!=-1) { //命中，跳出
                    flag = false;
                    break;
                }
            }
                
            if (flag) {
                rtnArr.push(itemAsync);
            }
            
        })
        
        return rtnArr;
    }
    
    
    
    
    /*************************
     * 输出资源
     * 遍历allRes，找到jsName同名的对象，输出其依赖
     *************************/
    function outputStr(jsName) {
        
        var arr = [];

        digui(jsName, arr);
        
        arr = quchong(arr);
        
        var str_sync = outputSyncStr(arr);
        var str_async = outputAsyncStr(arr);
        
        return str_sync + '\n    ' + str_async;
    }
    
    
    
    /*************************
     * 同步资源
     *************************/
    function outputSyncStr(arr) {
        var syncArr = arr.map(function(item) {
            return "<script src='" + item.fileUri + "'></script>";
        });
        return syncArr.join('\n    ');
    }
    
    

    /*************************
     * 异步资源
     *************************/
    function outputAsyncStr(arr) {
        
        var map = {},
            arrRtn = [];
        
        // 异步资源收集入 map
        arr.forEach(function(item) {
            item.asyncMap && procRes(item, map);
        });
        
        
        function procRes(res, rtnMap) {
            if (res.splice) {
                res.forEach(function(item){
                    item.asyncMap && procMap(item.asyncMap, rtnMap);
                })
            } else {
                res.asyncMap && procMap(res.asyncMap, rtnMap);
            }
        }
        
        
        function procMap(asyncMap, rtnMap) {
            for ( var key in asyncMap ) {
                procRes(rtnMap[key] = asyncMap[key], rtnMap);
            }
        }
        
        
        // map: {asyncRes_1: [deps, deps ...], asyncRes_2: [deps, deps ...]}
        for (var key in map) {
            
            var arrAsync = map[key];
            
            arrAsync = quchong(arrAsync);
            
            arrAsync = arrAsync.map(function(item) {
                return item.fileUri;
            });
            
            // 和同步资源去重
            arrAsync = quchongAsync(arrAsync, arr);
            
            var obj = {};
            obj[key] = arrAsync;
            arrRtn.push( '<script>require.loadAsync(' + JSON.stringify(obj) + ');</script>' );
        }

        
        return arrRtn.join('\n    ');
    
    }
    
    
    
    
    //再次遍历文件，找到isViews标记的文件
    //替换里面的__FRAMEWORK_CONFIG__钩子
    fis.util.map(ret.src, function(subpath, file) {
        //有isViews标记，并且是js或者html类文件，才需要做替换
        if (file.isViews && (file.isJsLike || file.isHtmlLike)) {

            // 当前view对应的js文件
            var jsName = file.id.replace(/\.vm/, '.js');
            
            var stringify = outputStr(jsName);

            //替换文件内容
            var content = file.getContent();
            content = content.replace(/\b__FRAMEWORK_CONFIG__\b/g, stringify);
            file.setContent(content);
        }
    });
    
    
    
    
    
    
    
    
    
};