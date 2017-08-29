var app = angular.module('flapperNews',['ui.router','base64']);
app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: '/home.html',
                controller: 'MainCtrl',
                resolve:{
                    postPromise:['posts',function (posts) {
                        return posts.getAll();
                    }]
                }
            })
            .state('posts', {
                url: '/posts/{id}',
                templateUrl: '/posts.html',
                controller: 'PostsCtrl',
                resolve:{
                    post:['$stateParams','posts',function ($stateParams,posts) {
                        return posts.get($stateParams.id);
                    }]
                }
            }).state('login',{
                url: '/login',
                templateUrl: '/login.html',
                controller: 'AuthCtrl',
                onEnter: ['$state','auth',function ($state,auth) {
                    if(auth.isLoggedIn()){
                        $state.go('home');
                    }
                }]
            }).state('register',{
                url: '/register',
                templateUrl: '/register.html',
                controller: 'AuthCtrl',
                onEnter: ['$state','auth',function ($state,auth) {
                    if(auth.isLoggedIn()){
                        $state.go('home');
                    }
                }]
            }).state('profile', {
                url: '/profile/{id}',
                templateUrl: '/profile.html',
                controller: 'ProCtrl',
                resolve:{
                    userInstance:['$stateParams','user',function ($stateParams,user) {
                        console.log("in profile state");
                        return user.get($stateParams.id);
                    }]
                }
            });
        $urlRouterProvider.otherwise('home');
    }]);

app.factory('posts', ['$http','auth',function ($http,auth) {
    var o = {
        posts: []
    };
    o.getAll = function () {
        return $http.get('/posts').success(function (data) {
           angular.copy(data,o.posts);
        });
    };
    o.create = function (post) {
        return $http.post('/posts',post,{
            headers: {Authorization: ' Bearer '+auth.getToken()}
        }).error(function (error) {
            console.log('post error ==> '+error);
        }).success(function (data) {
            console.log(data);
            o.posts.push(data);
        });
    };
    o.upvote = function (post) {
        return $http.put('/posts/'+post._id+'/upvote',null,{
            headers:{Authorization: ' Bearer '+auth.getToken()}
        }).success(function (data) {
            post.upvotes += 1;
        });
    };
    o.get = function (id) {
        return $http.get('/posts/'+id).then(function (res) {
            return res.data;
        });
    };
    o.addComment = function (id,comment) {
        return $http.post('/posts/'+id+'/comments',comment,{
            headers:{Authorization: ' Bearer '+auth.getToken()}
        }).error(function (error) {
            console.log('addComment err==> '+error);
        });
    };
    o.deleteComment = function (post,comment) {
        console.log("post id ==>"+post.body);
        console.log("comment body ==> "+comment.body);
        return $http.delete('/posts/'+post._id+'/comments/'+comment._id,{
            headers:{Authorization: ' Bearer '+auth.getToken()}
            })
            .error(function (error) {
                console.log('delete comment err '+error);
            }).success(function (data) {
                console.log("delete comment success!!!");
                var index = post.comments.indexOf(comment);
                post.comments.splice(index,1);
            });
    };
    o.deletePost = function (post) {
        return $http.delete('/posts/'+post._id,{
            headers:{Authorization: ' Bearer '+auth.getToken()}
        })
            .error(function (error) {
                console.log('delete post err '+error);
            }).success(function (data) {
                console.log("delete post success!!!");
                var index = o.posts.indexOf(post);
                o.posts.splice(index,1);
            });
    };
    o.upvoteComment = function (post,comment) {
        return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote',null,{
            headers:{Authorization: ' Bearer '+auth.getToken()}
            }).error(function (error) {
                console.log("upvote comment err ==>"+error);
            }).success(function (data) {
                console.log("o.upvotecomment success!!");
                comment.upvotes += 1;
            });
    };
    o.editComment = function (post,commentId,commentEditBody) {
        console.log("post id =>",post._id,"comment id =>",commentId,"  comment body =>",commentEditBody);
        return $http.post('/posts/' + post._id + '/comments/'+ commentId,commentEditBody,{
            headers:{Authorization: ' Bearer '+auth.getToken()}
        }).error(function (error) {
            console.log("edit comment info err ==>"+error);
            return false;
        }).success(function () {
            console.log("edit comment info success!!");
            return true;
        });
    }
    o.editPost = function (post,postEditBody) {
        return $http.post('/posts/' + post._id + '/edit',postEditBody,{
            headers:{Authorization: ' Bearer '+auth.getToken()}
        }).error(function (error) {
            console.log("edit post info err ==>"+error);
            return false;
        }).success(function () {
            console.log("edit post info success!!");
            return true;
        });
    }
    return o;
}]);

app.factory('user',['$http','auth',function ($http,auth){
    var user = {}
    user.get = function (id) {
        console.log("In user profile")
        return $http.get('/profile/'+id).then(function (res) {
            console.log("userget ==> ",res.data);
            user = res.data;
            console.log("user factory ",user);
            return res.data;
        });
    };
    user.updateInfo = function (id,updateInfoBody) {
         console.log("In updateInfo==>",updateInfoBody);
        return $http.post('/profile/'+id,updateInfoBody,{
            headers:{Authorization: ' Bearer '+auth.getToken()}
        }).error(function (error) {
            console.log("update user info err ==>"+error);
            return false;
        }).success(function () {
            console.log("update user info success!!");
            user.nickname = updateInfoBody.nickName;
            user.image = updateInfoBody.userImage;
            return true;
        });
    };

    user.testget = function () {
        return "this is test";
    }

    user.currentNickName = function () {
        // return "test";
        return user.nickname;
    }

    return user;
}]);

app.factory('auth',['$http','$window',function ($http,$window) {
    var auth = {};
    auth.saveToken = function (token) {
        $window.localStorage['flapper-news-token'] = token;
    };
    auth.getToken = function () {
        return $window.localStorage['flapper-news-token'];
    };
    auth.isLoggedIn = function () {
        var token = auth.getToken();
        if(token){
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        }else{
            return false;
        }
    };
    auth.currentUser = function () {
        if(auth.isLoggedIn()){
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]))
            return payload.username;
        }
    };
    auth.currentId = function () {
        if(auth.isLoggedIn()){
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]))
            return payload._id;
        }
    };
    auth.register = function (user) {
        return $http.post('/register',user).error(function (error) {
            console.log('auth error ' + error);
        }).success(function (data) {
            auth.saveToken(data.token);
        });
    };
    auth.logIn = function (user) {
        return $http.post('/login',user).success(function (data) {
            auth.saveToken(data.token);
        });
    };
    auth.logOut = function () {
        $window.localStorage.removeItem('flapper-news-token');
    };

    return auth;
}]);

app.controller('AuthCtrl',['$scope','$state','auth',function ($scope,$state,auth) {
    $scope.user = {};
    $scope.register = function () {
        auth.register($scope.user).error(function (error) {
            $scope.error = error;
        }).then(function () {
            $state.go('home');
        });
    };

    $scope.logIn = function () {
        auth.logIn($scope.user).error(function (error) {
            $scope.error = error;
        }).then(function () {
            $state.go('home');
        });
    };
}]);

app.controller('MainCtrl',['$scope','posts','auth',function ($scope,posts,auth) {
    $scope.warnMsgShow = false;
    $scope.posts = posts.posts;
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.user_id = auth.currentId;
    $scope.addPost = function () {
        if(!$scope.title|| !$scope.body){
            $scope.warnMsgShow = true
            $scope.addPostWaning = "All fields are required!";
            console.log("empty!!");
            return;
        }else {
            posts.create({
                title: $scope.title,
                body: $scope.body,
                link: $scope.link
            });
            $scope.warnMsgShow = false
            $scope.addPostWaning = '';
            $scope.body = '';
            $scope.title = '';
            $scope.link = '';
        }
    };
    $scope.incrementUpvotes = function (post) {
        posts.upvote(post);
    };
    $scope.isPostAuthor = function (post) {
        if(post.author === auth.currentUser()){
            return true;
        }
        return false;
    };
    $scope.removePost = function (post) {
        posts.deletePost(post).success(function () {
        }).error(function (error) {
            console.log('scope_deleteComment error:  '+error);
        });
    };
}]);
app.controller('PostsCtrl',['$scope','$stateParams','posts','post','auth',function ($scope, $stateParams, posts,post,auth) {
    $scope.post = post;
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.editarray = [];
    $scope.editBody = [];
    $scope.postEditableIndex = false;
    $scope.postEdit = {}
    $scope.postEdit.editPostTitle = post.title;
    $scope.postEdit.editPostBody = post.body;

    $scope.addComment = function () {
        if(!$scope.body){
            $scope.warnMsgShow = true;
            $scope.addCommentWaning = "Comment cannot be empty!";
            console.log("empty!!");
            return;
        }else{
            $scope.warnMsgShow = false;
            $scope.addCommentWaning = "";
        }
        posts.addComment(post._id,{
            body:$scope.body,
            author:'user'
        }).success(function (comment) {
            $scope.post.comments.push(comment);
        });
        $scope.body = '';
    }
    $scope.incrementUpvotes = function (comment) {
        posts.upvoteComment(post,comment).success(function () {
            console.log("upvote comment success!");
        });
    }
    $scope.isCommentAuthor = function (comment) {
        if(comment.author === auth.currentUser()){
            return true;
        }
        return false;
    };
    $scope.removeComment = function (comment) {
        posts.deleteComment(post,comment).success(function () {
            console.log(("success delete"+$scope.post.comments));
        }).error(function (error) {
            console.log('scope_deleteComment error:  '+error);
        });
    };

    $scope.changeEditable = function (index) {
        console.log("edit index ==>  ",index)
        if($scope.editarray[index] == undefined){
            console.log("undefined!!")
            $scope.editarray[index] = true
        }else{
            console.log("defined!!")
            $scope.editarray[index] = !$scope.editarray[index];
        }
    };

    $scope.changePostEditable = function () {
        $scope.postEditableIndex = !$scope.postEditableIndex
    }
    
    $scope.savePostEdit = function () {
        
    }

    $scope.editComment = function (comment) {
        posts.deleteComment(post,comment).success(function () {
            console.log(("success delete"+$scope.post.comments));
        }).error(function (error) {
            console.log('scope_deleteComment error:  '+error);
        });
    };
    $scope.showUserImage = function (data) {
        var image = new Image();
        image.src = data;
        return image
    }
    $scope.saveEditComment = function (index,commentEdit) {
        console.log("index: ",$scope.postEdit.editPostBody," body: ",$scope.postEdit.editPostBody);
        $scope.changeEditable(index);
        posts.editComment(post,$scope.post.comments[index]._id,
            {
                commentEditBody: commentEdit
            }).success(function () {
            console.log(("success edit"));
            $scope.post.comments[index].body = commentEdit;
            $scope.post.comments[index].date = Date.now();
        }).error(function (error) {
            console.log('scope_editComment error:  '+error);
        });
    }

    $scope.saveEditPost = function (editPostTitle,editPostBody) {
        console.log("title: ",editPostTitle," body: ",editPostBody);
        $scope.changePostEditable();
        posts.editPost(post,
            {
                postEditTitle: editPostTitle,
                postEditBody: editPostBody
            }).success(function () {
            console.log(("success edit"));
            $scope.post.title = editPostTitle;
            $scope.post.body = editPostBody;
            $scope.post.date = Date.now();
        }).error(function (error) {
            console.log('scope_editComment error:  '+error);
        });
    }

}]);
app.controller('NavCtrl',[
    '$scope',
    'auth',
    function ($scope,auth) {
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.logOut = auth.logOut;
        $scope.getUserId = auth.currentId;
    }
]);
app.controller('ProCtrl',[
    '$scope',
    '$base64',
    'auth',
    'user',
    'userInstance',
    function ($scope,$base64,auth,user,userInstance) {
        $scope.profile = {};
        // $scope.profile.test =
        $scope.profile.nickname = userInstance.nickname;
        // $scope.profile.nickname = user.currentNickName();
        console.log("test",userInstance.nickname);
        // console.log("ooooo  == ",$scope.getNickname);
        // $scope.profile.getNickname = "test";
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.image_source = userInstance.image;
        $scope.changeEditable = function () {
            if($scope.editIndex == true){
                $scope.editIndex = false;
            }else{
                $scope.editIndex = true;
            }
        };
        $scope.saveEditChange = function () {
                if(!$scope.profile.UserNickname){
                    $scope.warnMsgShow = true;
                    $scope.editProfileWaning = "NickName cannot be empty!";
                    console.log("empty!!");
                    return;
                }else{
                    console.log("nick name input: "+$scope.profile.UserNickname);
                    user.updateInfo(auth.currentId(),{
                            nickName: $scope.profile.UserNickname,
                            userImage: $scope.image_source
                        }
                    )

                    $scope.profile.nickname = $scope.profile.UserNickname;
                    console.log("save edit",$scope.profile.UserNickname)
                    $scope.UserNickname = '';
                    $scope.warnMsgShow = false;
                    $scope.addPostWaning = '';
                    $scope.changeEditable();
                }

        };

        $scope.click = function() {
            setTimeout(function() {
                var element = angular.element(document.getElementById('input'));
                element.triggerHandler('fileInput');
                $scope.clicked = true;
            }, 0);
        };

        $scope.triggerUpload = function () {
            var fileuploader = angular.element(document.getElementById('fileInput'));
            fileuploader.on('click',function(){
                console.log("File upload triggered programatically");
            })
            setTimeout(function() {
                document.getElementById('fileInput').click()
            }, 0);
        }


        $scope.uploadImage = function (element) {
            $scope.currentFile = element.files[0];
            var reader = new FileReader();

            reader.onload = function(event) {
                $scope.image_source = event.target.result;
                var fileSize = $scope.image_source.length
                if(fileSize > 80000){
                    $scope.warnMsgShow = true;
                    $scope.editProfileWaning = "Selected image file too large!";
                }else{
                    $scope.warnMsgShow = false;
                    $scope.editProfileWaning = "";
                }
                $scope.$apply()

            }
            // when the file is read it triggers the onload event above.
            reader.readAsDataURL(element.files[0]);

        }


    }
]);