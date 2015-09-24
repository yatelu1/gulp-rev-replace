'use strict';

angular.module('fullstakApp')
    .controller('BaseInfoCtrl', function ($scope, $q, $upload, $location, myConfig, $stateParams, $timeout, $http, $cookies, clubConf) {
        $scope.flagType = [
            {value: 16, text: 'grass_driving_range'},
            {value: 0, text: 'mat_driving_range'},
            {value: 1, text: 'putting_green'},
            {value: 2, text: 'chipping_green'},
            {value: 3, text: 'practice_bunker'},
            {value: 4, text: 'motor_cart'},
            {value: 5, text: 'pull_cart'},
            {value: 6, text: 'golf_club_rental'},
            {value: 7, text: 'club_fitting'},
            {value: 8, text: 'pro_shop'},
            {value: 9, text: 'golf_lessons'},
            {value: 10, text: 'caddie_hire'},
            {value: 11, text: 'restaurant'},
            {value: 12, text: 'receptions'},
            {value: 13, text: 'changing_room'},
            {value: 14, text: 'locker_room'},
            {value: 15, text: 'lodging'}
        ];

        $scope.fileName = "No file selected...";
        $("#roleName").text($cookies.name);
        //通过address+zipcode查询坐标
        $scope.getGeo = function () {
            var geocoder = new google.maps.Geocoder();
            var searchVal;
            if ($scope.club.postCode !== undefined || $scope.club.postCode !== "") {
                searchVal = $scope.club.address + ',' + $scope.club.postCode;
            } else {
                searchVal = $scope.curCountry + ',' + $scope.curState + ',' + $scope.curCity + ',' + $scope.club.address;
            }
            geocoder.geocode({'address': searchVal}, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    $scope.$apply(function () {
                        //$scope.club.geoPoint.latitude = results[0].geometry.location.A;
                        //$scope.club.geoPoint.longitude = results[0].geometry.location.F;
                        var clubGPS = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());

                        //$scope.map.setCenter(clubGPS);
                        if ($scope.map.markers[1]) {
                            $scope.map.markers[1].setPosition(clubGPS);
                        } else {

                            $scope.map.markers[1] = new google.maps.Marker({
                                position: clubGPS,
                                map: $scope.map,
                                icon: '/GPS2/static/assets/static/center.png',
                                draggable: false,
                                animation: google.maps.Animation.DROP
                            });
                            //$scope.map.markers[0].setPosition(clubGPS);

                        }

                        var new_boundary = new google.maps.LatLngBounds();

                        for (var index in $scope.map.markers) {
                            var position = $scope.map.markers[index].position;
                            new_boundary.extend(position);
                        }

                        $scope.map.fitBounds(new_boundary);

                    })
                } else {
                    $scope.msg = 'Geocode was not successful for the following reason: ' + status;
                }
            });
            $("#getGeo").hide();
        };

        $scope.setPin = function () {
            var geocoder = new google.maps.Geocoder();
            var searchVal;
            if ($scope.club.postCode !== undefined || $scope.club.postCode !== "") {
                searchVal = $scope.club.address + ',' + $scope.club.postCode;
            } else {
                searchVal = $scope.curCountry + ',' + $scope.curState + ',' + $scope.curCity + ',' + $scope.club.address;
            }
            geocoder.geocode({'address': searchVal}, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    $scope.$apply(function () {
                        $scope.club.geoPoint.latitude = results[0].geometry.location.lat();
                        $scope.club.geoPoint.longitude = results[0].geometry.location.lng();
                        var clubGPS = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());

                        $scope.map.setCenter(clubGPS);
                        $scope.map.markers[0].setPosition(clubGPS);

                    })
                } else {
                    $scope.msg = 'Geocode was not successful for the following reason: ' + status;
                }
            });
        };
        $('#address').on('input', function () {
            $("#getGeo").show();
        });
        $scope.map = [];
        $scope.flags = [];
        $scope.noteFlags = [];

        $scope.$on('mapInitialized', function (event, map) {
            var index = map.index;
            $scope.map[index] = map;
        });

        var clubId = $stateParams.id;

        var url = $location;
        var ns = url.search();
        if ($cookies.role === "ADMIN") {
            $scope.watchMode = true;
        } else {
            $scope.watchMode = false;
        }
        if ($cookies.name === "admin admin") {
            $scope.superAdmin = true;
        }
        $scope.updateState = function (id) {
            $http({
                url: myConfig.get('adminApi.endpoint') + '/getCountryRegionCities?request={countryId:{id:' + id + '}}',
                cache: true
            }).success(function (data) {
                $scope.regionCities = data.regions;
            });
        };
        $scope.updateCity = function (id) {
            $http({
                url: myConfig.get('adminApi.endpoint') + '/getCountryRegionCities?request={regionId:{id:' + id + '}}',
                cache: true
            }).success(function (data) {
                $scope.cities = data.cities;
            });
        };

        if (ns.type === 'newClub') {
            $q.all([
                $http({
                    method: 'POST',
                    url: myConfig.get('adminApi.endpoint') + "/manageClub2InfoDraft",
                    data: JSON.stringify({operation: "NEW"}),
                    withCredentials: true,
                    headers: {'Content-Type': 'application/json', 'Token': $cookies.Token}
                }),
                $http({
                    url: myConfig.get('adminApi.endpoint') + '/getCountryRegionCities',
                    cache: true
                })
            ]).then(function (data, err) {
                $scope.afterLoad = true;
                var club = data[0].data.clubInfo;
                var countries = data[1].data.countries;
                $scope.scorecardImages = data[0].data.scorecardImages;
                club.countryId = {};
                club.regionId = {};
                club.cityId = {};
                club.countryId.id = '4';
                club.regionId.id = '';
                club.cityId.id = '';
                club.geoPoint = {};
                club.tees = [];
                club.geoPoint.latitude = 35.784;
                club.geoPoint.longitude = -78.670;
                $scope.updateState(club.countryId.id);
                $('#country').on('change', function () {
                    $('#state').val('');
                    $('#city').val('');
                });


                $scope.club = club;
                $scope.countries = countries;
                $scope.imgLink = myConfig.get('imgLink.endpoint');

                $scope.clubConf = clubConf.flagType;


                var clubGPS = new google.maps.LatLng(club.geoPoint.latitude, club.geoPoint.longitude);


                $scope.mapRest = function () {
                    $timeout(function () {
                        if ($scope.map[0] && $scope.map[0].markers[0]) {
                            $scope.map[0].setCenter(clubGPS);
                            $scope.map[0].markers[0].setPosition(clubGPS);
                        }
                    }, 1000);
                };
                $scope.mapRest();

            });

        } else {
            $scope.showOverviewBtn = true;
            $q.all([
                $http({
                    url: myConfig.get('adminApi.endpoint') + '/getClub2Info?request={clubId:{id:%27' + clubId + '%27}}',
                    headers: {'Token': $cookies.Token}
                }),
                $http({
                    url: myConfig.get('adminApi.endpoint') + '/getCountryRegionCities',
                    cache: true
                })
            ]).then(function (data, err) {
                $scope.afterLoad = true;
                var club;
                var clubInfoDraft = data[0].data.clubInfoDraft;
                if (clubInfoDraft) {
                    club = data[0].data.clubInfoDraft.clubInfo;
                } else {
                    club = data[0].data.clubInfo;
                }
                var countries = data[1].data.countries;
                var clubStatus = data[0].data.clubStatus;
                var callerName = data[0].data.callerName;

                clubStatus.submittingNote = clubStatus.submittingNote ? clubStatus.submittingNote : {};
                clubStatus.editingStep = clubStatus.editingStep ? clubStatus.editingStep : {};
                var note = clubStatus.submittingNote.note ? clubStatus.submittingNote.note : '';
                $scope.scorecardNote = clubStatus.submittingNote.scorecardNote ? clubStatus.submittingNote.scorecardNote : '';
                $scope.layoutNote = clubStatus.submittingNote.layoutNote ? clubStatus.submittingNote.layoutNote : '';
                $scope.ratingsNote = clubStatus.submittingNote.ratingsNote ? clubStatus.submittingNote.ratingsNote : '';
                $scope.refused = {
                    value: clubStatus.submittingNote.refused ? true : false
                };


                $scope.stepType = clubStatus.editingStep.stepType ? clubStatus.editingStep.stepType : '';
                $scope.noteSaveText = clubStatus.editingStep.note ? clubStatus.editingStep.note : '';


                $scope.scorecardImages = data[0].data.scorecardImages;

                function ClubProcessResult(val) {
                    if (val === 'OFFICIAL') {
                        return 'Official';
                    } else if (val === 'THIRD_PARTY') {
                        return '3rd party';
                    } else if (val === 'NOT_AVAILABLE') {
                        return 'Not available';
                    } else {
                        return '--'
                    }
                };

                $scope.scorecardNoteDisplay = ClubProcessResult($scope.scorecardNote);
                $scope.layoutNoteDisplay = ClubProcessResult($scope.layoutNote);
                $scope.ratingsNoteDisplay = ClubProcessResult($scope.ratingsNote);


                var flg = club.flag;
                for (var i = 0; i < 17; i++) {
                    if ((flg & (1 << i)) === (1 << i)) {
                        $scope.flags.push(i);
                    }
                }
                var noteFlag = clubStatus.noteFlag;
                for (var i = 0; i < 9; i++) {
                    if ((noteFlag & (1 << i)) === (1 << i)) {
                        $scope.noteFlags.push(i);
                    }
                }


                // 切分美国手机号码
                if (club.phone !== undefined && club.phone.length === 12 && /\+1/.test(club.phone)) {
                    var phone = club.phone;
                    var country = phone.substring(0, 2),
                        region = phone.substring(2, 5),
                        body1 = phone.substring(5, 8),
                        body2 = phone.substring(8);

                    club.phone = country + ' (' + region + ') ' + body1 + '-' + body2;
                }

                if (club.website !== undefined && club.website.substring(0, 4) === 'http') {
                    club.formattedWebsite = club.website;
                } else {
                    club.formattedWebsite = 'http://' + club.website;
                }

                if (club.countryId === undefined) {
                    club.countryId = {};
                    club.countryId.id = '';
                }
                if (club.regionId === undefined) {
                    club.regionId = {};
                    club.regionId.id = '';
                }
                if (club.cityId === undefined) {
                    club.cityId = {};
                    club.cityId.id = '';
                }
                if (club.tees === undefined) {
                    club.tees = [];
                }
                $('#country').on('change', function () {
                    $('#state').val('');
                    $('#city').val('');
                });
                $scope.updateState(club.countryId.id);
                $scope.updateCity(club.regionId.id);


                $scope.club = club;
                $scope.clubStatus = clubStatus;
                $scope.callerName = callerName;
                $scope.callerCheck = {
                    value: false
                }
                $scope.noteText = note;
                $scope.overviewNote = clubStatus.overviewNote;


                $scope.countries = countries;
                $scope.imgLink = myConfig.get('imgLink.endpoint');

                $scope.clubConf = clubConf.flagType;


                var clubGPS = new google.maps.LatLng(club.geoPoint.latitude, club.geoPoint.longitude);
                $scope.mapRest = function () {
                    $timeout(function () {
                        if ($scope.map[0] && $scope.map[0].markers[0]) {
                            $scope.map[0].setCenter(clubGPS);
                            $scope.map[0].markers[0].setPosition(clubGPS);
                        }
                    }, 1000);
                };
                $scope.mapRest();

                if ($scope.club.holeSet2Infos !== undefined) {
                    for (var i = 0; i < $scope.club.holeSet2Infos.length; i++) {
                        var hhSet = $scope.club.holeSet2Infos[i];

                        for (var j = 0; j < hhSet.teeInfos.length; j++) {
                            if (hhSet.teeInfos[j].yardages === undefined) {
                                hhSet.teeInfos[j].yardages = [0, 0, 0, 0, 0, 0, 0, 0, 0];
                            }
                        }
                    }
                }
                for (var x = 0; x < club.holes.length; x++) {
                    var geoPoint = club.holes[x].geoPoints;
                    for (var y = 0; y < geoPoint.length; y++) {
                        if (geoPoint[y] === null) {
                            geoPoint[y] = {
                                "longitude": club.geoPoint.longitude,
                                "latitude": club.geoPoint.latitude
                            };
                        }
                        for (var z = 6; z <= 8; z++) {
                            if (geoPoint[z] === undefined) {
                                geoPoint[z] = {
                                    "longitude": club.geoPoint.longitude,
                                    "latitude": club.geoPoint.latitude
                                };
                            }
                        }
                    }
                }


            });
        }


        $scope.dragend = function (e) {
            var lat = e.latLng.lat(), lon = e.latLng.lng();
            $scope.club.geoPoint.latitude = lat;
            $scope.club.geoPoint.longitude = lon;
        };

        $scope.onFileSelect = function ($files) {
            $scope.fileName = $files[0].name;
            //$files: an array of files selected, each file has name, size, and type.
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: myConfig.get('adminApi.endpoint') + '/uploadImage', //upload.php script, node.js route, or servlet url
                    data: {request: JSON.stringify({clubId: {id: $scope.club.id.id}, imageType: "CLUB_SCORECARD"})},
                    file: file // or list of files ($files) for html5 only
                }).progress(function (evt) {
                }).success(function (data, status, headers, config) {
                    $scope.fileName = "";
                    !!$scope.scorecardImages ? $scope.scorecardImages.push({id: data.imageId.id}) : $scope.scorecardImages = [{id: data.imageId.id}];
                });
            }
        };


        $scope.deleteScoreCard = function (idx, imgId) {
            var confirm = window.confirm('Are you sure to delete?');
            if (confirm !== true) return;
            $http({
                method: 'POST',
                url: myConfig.get('adminApi.endpoint') + "/deleteImage",
                data: JSON.stringify({
                    clubId: {id: $scope.club.id.id},
                    imageType: "CLUB_SCORECARD",
                    scoreCardImageId: {id: imgId}
                })
            }).success(function (data, status, headers, config) {
                $scope.scorecardImages.splice(idx, 1);

            }).error(function (data, status, headers, config) {

            });

        };


        $scope.totalPar = function (idx, gender) {
            var tot = 0;
            for (var i = 0; i <= 8; i++) {
                if (typeof $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[i]] === 'undefined') {
                    continue;
                }
                if (gender === 0) {
                    tot += parseInt($scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[i]].menPar);
                } else {
                    tot += parseInt($scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[i]].ladiesPar);
                }
            }
            return tot;
        };
        $scope.totalHandicap = function (idx, gender) {
            var tot = 0;
            for (var i = 0; i <= 8; i++) {
                if (typeof $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[i]] === 'undefined') {
                    continue;
                }
                if (gender === 0) {
                    tot += parseInt($scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[i]].menHandicap);
                } else {
                    tot += parseInt($scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[i]].ladiesHandicap);
                }
            }
            return tot;
        };
        $scope.courseTotalPar = function (holeset, gender) {
            var tot = 0;
            for (var j = 0; j < $scope.club.holeSet2Infos.length; j++) {
                if (holeset === $scope.club.holeSet2Infos[j].name) {

                    for (var i = 0; i <= 8; i++) {
                        if (typeof $scope.club.holes[$scope.club.holeSet2Infos[j].holeIndexes[i]] === 'undefined') {
                            continue;
                        }
                        if (gender === 0) {
                            tot += parseInt($scope.club.holes[$scope.club.holeSet2Infos[j].holeIndexes[i]].menPar);
                        } else {
                            tot += parseInt($scope.club.holes[$scope.club.holeSet2Infos[j].holeIndexes[i]].ladiesPar);
                        }
                    }
                }

            }

            return tot;
        };

        $scope.courseTotalHandicap = function (holeset, gender) {
            var tot = 0;
            for (var j = 0; j < $scope.club.holeSet2Infos.length; j++) {
                if (holeset === $scope.club.holeSet2Infos[j].name) {

                    for (var i = 0; i <= 8; i++) {
                        if (typeof $scope.club.holes[$scope.club.holeSet2Infos[j].holeIndexes[i]] === 'undefined') {
                            continue;
                        }
                        if (gender === 0) {
                            tot += parseInt($scope.club.holes[$scope.club.holeSet2Infos[j].holeIndexes[i]].menHandicap);
                        } else {
                            tot += parseInt($scope.club.holes[$scope.club.holeSet2Infos[j].holeIndexes[i]].ladiesHandicap);
                        }
                    }
                }

            }

            return tot;
        };
        $scope.deleteClubHoleSet = function (idx) {
            var confirm = window.confirm('Are you sure to delete?');
            if (confirm !== true) return;

            $scope.club.holeSet2Infos.splice(idx, 1);
            $scope.myMaps.splice(idx, 1);
            if ($scope.club.courseInfos !== undefined) {
                for (var i = 0; i < $scope.club.courseInfos.length; i++) {
                    var curCourse = $scope.club.courseInfos[i];
                    for (var j = 0; j < curCourse.holeSetIndexes.length; j++) {
                        var curIndex = curCourse.holeSetIndexes[j];
                        if (curIndex === idx) {
                            curCourse.holeSetIndexes.splice(j, 1);
                            curCourse.holeCount = curCourse.holeSetIndexes.length * 9;
                        }
                    }
                }
            }

        };

        $scope.delTee = function (idx) {
            var confirm = window.confirm('Are you sure to delete?');
            if (confirm !== true) return;
            for (var j = 0; j < $scope.club.holeSet2Infos.length; j++) {
                var hhSet = $scope.club.holeSet2Infos[j];
                if (typeof hhSet.teeInfos === 'undefined') {
                    return;
                }
                for (var i = 0; i < hhSet.teeInfos.length; i++) {
                    if (i === idx) {
                        hhSet.teeInfos.splice(i, 1);
                        break;
                    }
                }
            }

            $scope.refreshCourse();
        };

        $scope.addTee = function () {
            for (var i = 0; i < $scope.club.holeSet2Infos.length; i++) {
                var hhSet = $scope.club.holeSet2Infos[i];

                if (typeof hhSet.teeInfos === 'undefined') {
                    hhSet.teeInfos = [];
                }

                hhSet.teeInfos.push({
                    name: 'Name',
                    gender: '',
                    tcr: 0,
                    tsl: 0,
                    yardages: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    isnew: true
                });


            }
            for (var j = 0; j < $scope.club.courseInfos.length; j++) {
                var hhSet = $scope.club.courseInfos[j];

                if (typeof hhSet.teeInfos === 'undefined') {
                    hhSet.teeInfos = [];
                }
                hhSet.teeInfos.push({
                    name: 'Name',
                    gender: '',
                    tcr: 0,
                    tsl: 0,
                    yardages: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                });
            }
        };
        $scope.getHoleSet = function (holeset, gender, name) {
            for (var i = 0; i < $scope.club.holeSet2Infos.length; i++) {
                for (var j = 0; j < $scope.club.holeSet2Infos[i].teeInfos.length; j++) {
                    if (holeset === $scope.club.holeSet2Infos[i].name && gender === $scope.club.holeSet2Infos[i].teeInfos[j].gender && name === $scope.club.holeSet2Infos[i].teeInfos[j].name) {

                        return $scope.club.holeSet2Infos[i].teeInfos[j];
                    }
                }
            }
        };
        $scope.totalHoleSet = function (holeset, gender, name) {
            var tot = 0;
            for (var i = 0; i < $scope.club.holeSet2Infos.length; i++) {
                for (var j = 0; j < $scope.club.holeSet2Infos[i].teeInfos.length; j++) {
                    if (holeset === $scope.club.holeSet2Infos[i].name && gender === $scope.club.holeSet2Infos[i].teeInfos[j].gender && name === $scope.club.holeSet2Infos[i].teeInfos[j].name) {
                        for (var x = 0; x <= 8; x++) {
                            if (typeof $scope.club.holeSet2Infos[i].teeInfos[j].yardages === 'undefined') {
                                return;
                            }
                            tot += parseInt($scope.club.holeSet2Infos[i].teeInfos[j].yardages[x]);

                        }
                    }
                }
            }
            return tot;
        };
        $scope.addClubHoleSet = function () {
            var hs = {};
            var hl = {};
            hs.name = '';
            hs.isNewSet = true;
            var start = $scope.club.holes ? $scope.club.holes.length : 0;
            hs.holeIndexes = [];
            hs.teeInfos = [];
            for (var j = 0; j < 9; j++) {
                hs.holeIndexes.push(start);
                start++;
            }
            for (var i = 0; i < 9; i++) {
                hl[i] = {
                    "geoPoints": [],
                    "menPar": 0,
                    "ladiesPar": 0,
                    "menHandicap": 0,
                    "ladiesHandicap": 0
                };

                for (var x = 0; x < 9; x++) {
                    hl[i].geoPoints[x] = {
                        "longitude": $scope.club.geoPoint.longitude,
                        "latitude": $scope.club.geoPoint.latitude
                    };
                }
                !!$scope.club.holes ? $scope.club.holes.push(hl[i]) : $scope.club.holes = [hl[i]];
            }


            if ($scope.club.holeSet2Infos === undefined || $scope.club.holeSet2Infos.length === 0) {
                hs.teeInfos = [];
            } else {
                hs.teeInfos = JSON.parse(JSON.stringify($scope.club.holeSet2Infos[0].teeInfos));
                for (var y = 0; y < hs.teeInfos.length; y++) {
                    hs.teeInfos[y].tcr = 0;
                    hs.teeInfos[y].tsl = 0;
                    hs.teeInfos[y].yardages = [0, 0, 0, 0, 0, 0, 0, 0, 0]
                }
            }


            !!$scope.club.holeSet2Infos ? $scope.club.holeSet2Infos.push(hs) : $scope.club.holeSet2Infos = [hs];


            var index = $scope.club.holeSet2Infos.length;

            var interVal = setInterval(function () {
                var target = $('.category')[index - 1];
                if (!!target) {
                    angular.element('body').animate({scrollTop: $(target).offset().top - 80}, 300);
                    $($(target).find('a')[0]).trigger('click');
                    clearInterval(interVal);
                }
            }, 200);
        };

        $scope.copyClubHoleSet = function (idx) {
            var hs = {};
            var hl = {};
            hs.name = $scope.club.holeSet2Infos[idx].name;
            hs.isNewSet = true;
            var start = $scope.club.holes ? $scope.club.holes.length : 0;
            hs.holeIndexes = [];
            hs.teeInfos = [];
            for (var j = 0; j < 9; j++) {
                hs.holeIndexes.push(start);
                start++;
            }
            for (var i = 0; i < 9; i++) {
                hl[i] = JSON.parse(JSON.stringify($scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[i]]));

                !!$scope.club.holes ? $scope.club.holes.push(hl[i]) : $scope.club.holes = [hl[i]];
            }


            hs.teeInfos = JSON.parse(JSON.stringify($scope.club.holeSet2Infos[idx].teeInfos));


            !!$scope.club.holeSet2Infos ? $scope.club.holeSet2Infos.push(hs) : $scope.club.holeSet2Infos = [hs];


            var index = $scope.club.holeSet2Infos.length;

            var interVal = setInterval(function () {
                var target = $('.category')[index - 1];
                if (!!target) {
                    angular.element('body').animate({scrollTop: $(target).offset().top - 80}, 300);
                    $($(target).find('a')[0]).trigger('click');
                    clearInterval(interVal);
                }
            }, 200);
        };
        $scope.delCourse = function (idx) {
            var confirm = window.confirm('Are you sure to delete?');
            if (confirm !== true) return;
            $scope.club.courseInfos.splice(idx, 1);
        };
//新增18洞
        $scope.addCourse = function () {
            if ($scope.club.holeSet2Infos === undefined) {
                $scope.msg = "you should set the holeset first";
                return;
            } else {
                var cur = {};
                cur.name = '';
                cur.holeCount = 0;
                //cur.teeInfos = $scope.club.tees;
                cur.holeSetIndexes = [];
                if ($scope.club.holeSet2Infos === undefined || $scope.club.holeSet2Infos.length === 0) {
                    cur.teeInfos = [];
                } else {
                    cur.teeInfos = [];
                    cur.teeInfos = JSON.parse(JSON.stringify($scope.club.holeSet2Infos[0].teeInfos));
                    for (var y = 0; y < cur.teeInfos.length; y++) {
                        cur.teeInfos[y].tcr = 0;
                        cur.teeInfos[y].tsl = 0;
                        delete cur.teeInfos[y].yardages;
                    }
                }
                if (!!$scope.club.courseInfos) {
                    $scope.club.courseInfos.push(cur);
                } else {
                    $scope.club.courseInfos = [cur];
                }


                var index = $scope.club.courseInfos.length;

                var interVal = setInterval(function () {
                    var target = $('.course')[index - 1];
                    if (!!target) {
                        angular.element('body').animate({scrollTop: $(target).offset().top - 80}, 300);
                        clearInterval(interVal);
                    }
                }, 200);
            }


        };
        $scope.upHoleSet = function (idx) {
            if ($scope.club.courseInfos[idx].holeSetIndexes.length !== 1) {
                var inmm = $scope.club.courseInfos[idx].holeSetIndexes[0];
                var outmm = $scope.club.courseInfos[idx].holeSetIndexes[1];
                $scope.club.courseInfos[idx].holeSetIndexes[0] = outmm;
                $scope.club.courseInfos[idx].holeSetIndexes[1] = inmm;
            }
        };

        $scope.delHoleSet = function (idx) {
            if (typeof $scope.holeSetSelection[idx].right === 'undefined') {
                return;
            }

            if ($scope.club.courseInfos[idx].holeSetIndexes[0] !== undefined) {
                var name0 = $scope.club.holeSet2Infos[$scope.club.courseInfos[idx].holeSetIndexes[0]].name;
                if (name0 != 'undefined' && name0 === $scope.holeSetSelection[idx].right[0]) {
                    $scope.club.courseInfos[idx].holeSetIndexes.splice(0, 1);
                }
            }
            if ($scope.club.courseInfos[idx].holeSetIndexes[1] !== undefined) {
                var name1 = $scope.club.holeSet2Infos[$scope.club.courseInfos[idx].holeSetIndexes[1]].name;
                if (name1 != 'undefined' && name1 === $scope.holeSetSelection[idx].right[0]) {
                    $scope.club.courseInfos[idx].holeSetIndexes.splice(1, 1);
                }
            }


            $scope.countHoles(idx);

            $scope.refreshCourseTee(idx);

        };
        $scope.addHoleSet = function (idx) {
            if (typeof $scope.holeSetSelection[idx].left === 'undefined') {
                return;
            }
            var index;
            for (var i = 0; i < $scope.club.holeSet2Infos.length; i++) {
                if ($scope.club.holeSet2Infos[i].name === $scope.holeSetSelection[idx].left[0]) {
                    index = i;
                    break;
                }
            }

            if ($('.holeSetSelectionRight:eq(' + idx + ') option:selected').index() === 1) {
                $scope.club.courseInfos[idx].holeSetIndexes[1] = index;
            } else {
                $scope.club.courseInfos[idx].holeSetIndexes[0] = index;
            }
            $scope.refreshCourseTee(idx);
            $scope.countHoles(idx);

        };
        $scope.countHoles = function (idx) {
            var holecount0;
            var holecount1;
            if ($scope.club.courseInfos[idx].holeSetIndexes[0] !== undefined) {
                holecount0 = 9;
            } else {
                holecount0 = 0;
            }
            if ($scope.club.courseInfos[idx].holeSetIndexes[1] !== undefined) {
                holecount1 = 9;
            } else {
                holecount1 = 0;
            }
            $scope.club.courseInfos[idx].holeCount = parseInt(holecount0) + parseInt(holecount1);
        };
        $scope.refreshOthers = function (idx, name) {
            for (var i = 0; i < $scope.club.holeSet2Infos.length; i++) {
                var hhSet = $scope.club.holeSet2Infos[i];
                hhSet.teeInfos[idx].name = name;
            }
            if ($scope.club.courseInfos !== undefined) {
                for (var x = 0; x < $scope.club.courseInfos.length; x++) {
                    var hhSetCourses = $scope.club.courseInfos[x];
                    hhSetCourses.teeInfos[idx].name = name;
                }
            }

        };
        $scope.refreshOtherGender = function (idx, name) {
            for (var i = 0; i < $scope.club.holeSet2Infos.length; i++) {
                var hhSet = $scope.club.holeSet2Infos[i];
                hhSet.teeInfos[idx].gender = name;
            }
            for (var x = 0; x < $scope.club.courseInfos.length; x++) {
                var hhSetCourses = $scope.club.courseInfos[x];
                hhSetCourses.teeInfos[idx].gender = name;
            }
        };
        $scope.refreshCourse = function () {
            for (var i = 0; i < $scope.club.courseInfos.length; i++) {
                //var cur = $scope.club.courseInfos[i];
                //console.log(cur);
                $scope.refreshCourseTee(i);
            }
        };


        $scope.refreshCourseTee = function (idx) {
            var cur = $scope.club.courseInfos[idx];
            //merge in and out tees
            var mergeKeys = {};
            var mergeIdKeys = {};
            var wt = 0;
            $scope.courseRating = $scope.courseRating || {};
            for (var i = 0; i < $scope.club.holeSet2Infos.length; i++) {
                //九洞数据
                var hsObj = $scope.club.holeSet2Infos[i];
                //if (cur.holeSetIndexes[0] === "" && cur.holeSetIndexes[1] === "") {
                //    for (var j = 0; j <= cur.teeInfos.length; j++) {
                //        cur.teeInfos.splice(j, 1);
                //    }
                //} else {
                if ($scope.club.holeSet2Infos[cur.holeSetIndexes[0]] === undefined) {
                    return;
                } else if (hsObj.name === $scope.club.holeSet2Infos[cur.holeSetIndexes[0]].name) {
                    wt = wt | 1; // wt = 1 后九洞
                }
                if ($scope.club.holeSet2Infos[cur.holeSetIndexes[1]] === undefined) {
                    return;
                } else if (hsObj.name === $scope.club.holeSet2Infos[cur.holeSetIndexes[1]].name) {
                    wt = wt | 2; // wt =2  前九洞
                }


                //tee数据
                var hsTeeList = hsObj.teeInfos;
                for (var j = 0; j < hsTeeList.length; j++) {
                    var hst = hsTeeList[j];
                    if (typeof mergeKeys[hst.name + "-" + hst.gender] === 'undefined') {
                        mergeKeys[hst.name + "-" + hst.gender] = 1;
                        mergeIdKeys[hst.name + "-" + hst.gender] = hst;
                    }
                    //else {
                    //    if (mergeIdKeys[hst.name + "-" + hst.gender].isnew) {
                    //        mergeIdKeys[hst.name + "-" + hst.gender].id = hst.id;
                    //        mergeIdKeys[hst.name + "-" + hst.gender] = hst;
                    //    } else {
                    //        hsTeeList[j].id = mergeIdKeys[hst.name + "-" + hst.gender].id;
                    //    }
                    //    mergeKeys[hst.name + "-" + hst.gender] += 1;
                    //}
                }
                //}
            }
            var wht = 2;
            if ((wt & 1) !== 1) {
                cur.holeSetIndexes[0] = undefined;
                wht--;
            }
            if ((wt & 2) !== 2) {
                cur.holeSetIndexes[1] = undefined;
                wht--;
            }
            if (cur.teeInfos === undefined) {
                cur.teeInfos = $scope.club.tees;
            }
            for (var i = cur.teeInfos.length - 1; i >= 0; i--) {
                var tee = cur.teeInfos[i];
                //console.log(tee);
                $scope.courseRating[tee.name + "-" + tee.gender] = tee;
                if (mergeKeys[tee.name + "-" + tee.gender] >= wht) {
                    mergeKeys[tee.name + "-" + tee.gender] = 0;
                } else {
                    cur.teeInfos.splice(i, 1);
                }
            }

            for (var mm in mergeKeys) {
                var data = mm.split('-'),
                    name = data[0],
                    gender = data[1];
                var hstee = mergeIdKeys[name + "-" + gender];
                var flag = true;
                for (i = 0; i < cur.teeInfos.length; i++) {
                    var tee = cur.teeInfos[i];
                    if (tee.name === hstee.name && tee.gender === hstee.gender) {
                        flag = false;
                    }
                }

                if (flag) {
                    cur.teeInfos.push({
                        name: hstee.name,
                        gender: hstee.gender,
                        tcr: 0/*tmp.tcr*/,
                        tsl: 0/*tmp.tsl*/,
                        yardages: hstee.yardages
                    });
                }
            }
        };

        $scope.save = function (operation) {
            var fff = 0;
            for (var i = 0; i < $scope.flags.length; i++) {
                fff = fff | (1 << $scope.flags[i]);
            }
            $scope.club.flag = fff;


            $scope.startProcess();
            //console.log($scope.club);return;
            $scope.submitted = true;

            $http({
                method: 'POST',
                url: myConfig.get('adminApi.endpoint') + "/manageClub2InfoDraft",
                data: JSON.stringify({
                    operation: operation,
                    clubInfo: $scope.club,
                    editingStep: {
                        stepType: $scope.stepType,
                        note: $scope.noteSaveText
                    }
                }),
                withCredentials: true,
                headers: {'Content-Type': 'application/json', 'Token': $cookies.Token}
            }).success(function (data, status, headers, config) {
                $scope.stopProcess();
                $('#myModalSave').modal('hide');
                if (status === 200) {
                    if (data.error === undefined) {
                        $scope.msg = 'save success';
                    } else {
                        $scope.msg = data.error;
                    }
                } else {
                    $scope.msg = data.code;
                }
            }).error(function (data, status, headers, config) {
                $scope.stopProcess();
                $scope.msg = "Network Error " + status;
            });
        };
        $scope.submit = function () {
            var fff = 0;
            var operation;
            for (var i = 0; i < $scope.flags.length; i++) {
                fff = fff | (1 << $scope.flags[i]);
            }
            $scope.club.flag = fff;

            if ($scope.callerCheck.value) {
                operation = 'TRANSFER';
            } else {
                operation = 'SUBMIT';
            }


            $scope.startProcess();
            //console.log($scope.club);return;
            $scope.submitted = true;

            $http({
                method: 'POST',
                url: myConfig.get('adminApi.endpoint') + "/manageClub2InfoDraft",
                data: JSON.stringify({
                    operation: operation,
                    clubInfo: $scope.club,
                    submittingNote: {
                        scorecardNote: $scope.scorecardNote,
                        layoutNote: $scope.layoutNote,
                        ratingsNote: $scope.ratingsNote,
                        note: $scope.noteText,
                        refused: $scope.refused.value
                    }

                }),
                withCredentials: true,
                headers: {'Content-Type': 'application/json', 'Token': $cookies.Token}
            }).success(function (data, status, headers, config) {

                $scope.stopProcess();
                $('#myModal').modal('hide');
                if (status === 200) {
                    if (data.error === undefined) {
                        $scope.msg = 'submit success';
                    } else {
                        $scope.msg = data.error;
                    }
                } else {
                    $scope.msg = data.code;
                }
            }).error(function (data, status, headers, config) {
                $scope.stopProcess();
                $scope.msg = "Network Error " + status;
            });
        };
        $scope.deleteClub = function () {
            var confirm = window.confirm('Are you sure to delete?');
            if (confirm !== true) return;
            $http({
                method: 'POST',
                url: myConfig.get('adminApi.endpoint') + "/deleteClub",
                data: JSON.stringify({clubId: {id: $scope.club.id.id}}),
                withCredentials: true,
                headers: {'Content-Type': 'application/json', 'Token': $cookies.Token}
            }).success(function (data, status, headers, config) {
                if (data.error) {
                    $scope.msg = data.error;
                } else {
                    location.href = "/GPS2/list/listAdminClub";
                }

            });
        };
        $scope.disCardClubDraft = function () {
            var confirm = window.confirm('Are you sure to disCard?');
            if (confirm !== true) return;
            $http({
                method: 'POST',
                url: myConfig.get('adminApi.endpoint') + "/manageClub2InfoDraft",
                data: JSON.stringify({operation: "DELETE", clubId: {id: $scope.club.id.id}}),
                withCredentials: true,
                headers: {'Content-Type': 'application/json', 'Token': $cookies.Token}
            }).success(function (data, status, headers, config) {
                if (data.error) {
                    $scope.msg = data.error;
                } else {
                    location.href = "/GPS2/list/listAdminClub";
                }
            }).error(function (data, status, headers, config) {
                $scope.msg = "network error " + status;
            });
        };
        $scope.updateOverviewNote = function () {
            $http({
                method: 'POST',
                url: myConfig.get('adminApi.endpoint') + "/updateOverviewNote",
                data: JSON.stringify({clubId: {id: $scope.club.id.id}, overviewNote: $scope.overviewNote}),
                withCredentials: true,
                headers: {'Content-Type': 'application/json', 'Token': $cookies.Token}
            }).success(function (data, status, headers, config) {
                if (data.error) {
                    $scope.msg = data.error;
                } else {
                    $scope.msg = 'save success';
                }

            });
        };

//posting 动画开始
        $scope.startProcess = function () {
            var str = 'Processing.';
            $scope.processTimer = setInterval(function () {
                str += '.';
                $scope.msg = str;
            }, 200);
        };

//posting 动画结束
        $scope.stopProcess = function () {
            clearInterval($scope.processTimer);
        };
        $scope.showMissingPin = function (idx, hn) {
            var hsObj = $scope.club.holeSet2Infos[idx];
            var holeGeoPoints = $scope.club.holes[hsObj.holeIndexes[hn]].geoPoints;
            var clubGeoPoints = $scope.club.geoPoint;
            if (holeGeoPoints[0].longitude === clubGeoPoints.longitude || holeGeoPoints[1].longitude === clubGeoPoints.longitude || holeGeoPoints[2].longitude === clubGeoPoints.longitude || holeGeoPoints[3].longitude === clubGeoPoints.longitude || holeGeoPoints[4].longitude === clubGeoPoints.longitude || holeGeoPoints[6].longitude === clubGeoPoints.longitude || holeGeoPoints[7].longitude === clubGeoPoints.longitude || holeGeoPoints[8].longitude === clubGeoPoints.longitude) {
                return true;
            }
        };
        $scope.clearPin = function (idx, hn) {
            var confirm = window.confirm('Are you sure to clear pin?');
            if (confirm !== true) return;
            var hsObj = $scope.club.holeSet2Infos[idx];
            var holeGeoPoints = $scope.club.holes[hsObj.holeIndexes[hn]].geoPoints;
            var clubGeoPoints = $scope.club.geoPoint;
            holeGeoPoints[0].longitude = clubGeoPoints.longitude;
            holeGeoPoints[1].longitude = clubGeoPoints.longitude;
            holeGeoPoints[2].longitude = clubGeoPoints.longitude;
            holeGeoPoints[3].longitude = clubGeoPoints.longitude;
            holeGeoPoints[4].longitude = clubGeoPoints.longitude;
            holeGeoPoints[6].longitude = clubGeoPoints.longitude;
            holeGeoPoints[7].longitude = clubGeoPoints.longitude;
            holeGeoPoints[8].longitude = clubGeoPoints.longitude;
            holeGeoPoints[0].latitude = clubGeoPoints.latitude;
            holeGeoPoints[1].latitude = clubGeoPoints.latitude;
            holeGeoPoints[2].latitude = clubGeoPoints.latitude;
            holeGeoPoints[3].latitude = clubGeoPoints.latitude;
            holeGeoPoints[4].latitude = clubGeoPoints.latitude;
            holeGeoPoints[6].latitude = clubGeoPoints.latitude;
            holeGeoPoints[7].latitude = clubGeoPoints.latitude;
            holeGeoPoints[8].latitude = clubGeoPoints.latitude;
            $scope.showMissingPin(idx, hn);
            $scope.myMaps[idx].setCenter($scope.clubLatLng);
            $scope.myMaps[idx].setZoom(16);
        };


// map 选项

        $scope.holes = [];
        $scope.holeSetSelection = [];
        $scope.marker = {};
        $scope.myMaps = [];
        $scope.gpsMarkers = [];
        $scope.isNewHoleSet = [];
        $scope.missPin = [];
//球洞GPS init
        $scope.onProjection = function (idx) {
            $scope.myMaps[idx] = this.myMap;
            $scope.holeClick(idx, 1);
            var category = angular.element('.category')[idx];
            var tag = angular.element(category).children()[0];
            angular.element(tag).addClass('bg-primary');
        };


        $scope.distance = function (p1, p2) {
            var R = 6371000; // Earth’s mean radius in meter
            var dLat = (p2.latitude - p1.lat()) * Math.PI / 180;
            var dLong = (p2.longitude - p1.lng()) * Math.PI / 180;
            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((p1.lat()) * Math.PI / 180) * Math.cos((p2.latitude) * Math.PI / 180) *
                Math.sin(dLong / 2) * Math.sin(dLong / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c * 1.09361;
            return Math.ceil(d); // returns the distance in meter
        };

        $scope.distance2 = function (p1, p2) {
            var R = 6378137; // Earth’s mean radius in meter
            var dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
            var dLong = (p2.longitude - p1.longitude) * Math.PI / 180;
            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((p1.latitude) * Math.PI / 180) * Math.cos((p2.latitude) * Math.PI / 180) *
                Math.sin(dLong / 2) * Math.sin(dLong / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c * 1.09361;
            return Math.ceil(d); // returns the distance in meter
        };
        var icon = {
            url: ''
        };
        $scope.showTeeMarker = function (gpsMarker, idx, pos) {
            //发球台
            if (typeof gpsMarker.teeMarker === 'undefined') {
                icon.url = '/GPS2/static/assets/static/tee.png';
                gpsMarker.teeMarker = new google.maps.Marker({
                    position: pos,
                    map: $scope.myMaps[idx],
                    icon: icon,
                    draggable: true,
                    title: "Tee Marker"
                });
                google.maps.event.addListener(gpsMarker.teeMarker, 'drag', function (event) {
                    $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[0].latitude = event.latLng.lat();
                    $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[0].longitude = event.latLng.lng();
                    var distance = $scope.distance(event.latLng, $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[1]);
                    var distance2 = $scope.distance2($scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[1], $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[3]);
                    var distanceTotal = distance + distance2;
                    infowindow3.setContent('To GC: ' + distance2 + 'yd <br> To Tee: ' + distance + 'yd <br>Total: ' + distanceTotal + 'yd');
                    infowindow1.setContent('To FC: ' + distance + 'yd');
                    if ($scope.showYardages[idx]) {
                        infowindow1.open($scope.myMaps[idx], gpsMarker.teeMarker);
                    }
                });
            }
        };

        $scope.showGreenFrontMarker = function (gpsMarker, idx, pos) {
            //果岭前沿
            if (typeof gpsMarker.greenFrontMarker === 'undefined') {
                icon.url = '/GPS2/static/assets/static/red.png';
                gpsMarker.greenFrontMarker = new google.maps.Marker({
                    position: pos,
                    map: $scope.myMaps[idx],
                    icon: icon,
                    draggable: true,
                    title: "Green Front Marker"
                });
                google.maps.event.addListener(gpsMarker.greenFrontMarker, 'dragend', function (event) {
                    $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[2].latitude = event.latLng.lat();
                    $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[2].longitude = event.latLng.lng();
                });
            }
        };

        $scope.showGreenMarker = function (gpsMarker, idx, pos) {
            //果岭中心点
            if (typeof gpsMarker.greenMarker === 'undefined') {
                icon.url = '/GPS2/static/assets/static/orange.png';
                gpsMarker.greenMarker = new google.maps.Marker({
                    position: pos,
                    map: $scope.myMaps[idx],
                    icon: icon,
                    draggable: true,
                    title: "Green Center Marker"
                });
                google.maps.event.addListener(gpsMarker.greenMarker, 'drag', function (event) {
                    $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[3].latitude = event.latLng.lat();
                    $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[3].longitude = event.latLng.lng();
                    var distance = $scope.distance(event.latLng, $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[1]);
                    var distance2 = $scope.distance2($scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[1], $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[0]);
                    var distanceTotal = distance + distance2;
                    infowindow2.setContent('To FC: ' + distance + 'yd');
                    infowindow3.setContent('To GC: ' + distance + 'yd <br> To Tee: ' + distance2 + 'yd <br>Total: ' + distanceTotal + 'yd');
                    if ($scope.showYardages[idx]) {
                        infowindow2.open($scope.myMaps[idx], gpsMarker.greenMarker);
                    }
                });
            }
        };

        $scope.showGreenBackMarker = function (gpsMarker, idx, pos) {
            //果岭后沿
            if (typeof gpsMarker.greenBackMarker === 'undefined') {
                icon.url = '/GPS2/static/assets/static/blue.png';
                gpsMarker.greenBackMarker = new google.maps.Marker({
                    position: pos,
                    map: $scope.myMaps[idx],
                    icon: icon,
                    draggable: true,
                    title: "Green Back Marker"
                });
                google.maps.event.addListener(gpsMarker.greenBackMarker, 'dragend', function (event) {
                    $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[4].latitude = event.latLng.lat();
                    $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[4].longitude = event.latLng.lng();
                });
            }
        };

        $scope.showCenterMarker = function (gpsMarker, idx, pos) {
            //球场中心点
            if (typeof gpsMarker.centerMarker === 'undefined') {
                icon.url = '/GPS2/static/assets/static/center.png';
                gpsMarker.centerMarker = new google.maps.Marker({
                    position: pos,
                    map: $scope.myMaps[idx],
                    icon: icon,
                    draggable: true,
                    title: "Center Marker"
                });
                google.maps.event.addListener(gpsMarker.centerMarker, 'drag', function (event) {
                    $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[1].latitude = event.latLng.lat();
                    $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[1].longitude = event.latLng.lng();
                    var distance = $scope.distance(event.latLng, $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[3]);
                    var distance2 = $scope.distance(event.latLng, $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[0]);
                    var distanceTotal = distance + distance2;

                    infowindow1.setContent('To FC: ' + distance2 + 'yd');
                    infowindow2.setContent('To FC: ' + distance + 'yd');
                    infowindow3.setContent('To GC: ' + distance + 'yd <br> To Tee: ' + distance2 + 'yd <br>Total: ' + distanceTotal + 'yd');
                    //infowindow.setContent('From Tee: ' + distance2 +'m');
                    if ($scope.showYardages[idx]) {
                        infowindow3.open($scope.myMaps[idx], gpsMarker.centerMarker);
                    }
                });
            }
        };

        $scope.showFifthMarker = function (gpsMarker, idx, pos) {
            //50
            if (typeof gpsMarker.fifthMarker === 'undefined') {
                icon.url = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=5|FFFFFF|000000';
                gpsMarker.fifthMarker = new google.maps.Marker({
                    position: pos,
                    map: $scope.myMaps[idx],
                    icon: icon,
                    draggable: true,
                    title: "attack reference 50"
                });
                google.maps.event.addListener(gpsMarker.fifthMarker, 'drag', function (event) {
                    $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[6].latitude = event.latLng.lat();
                    $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[6].longitude = event.latLng.lng();
                    var distance = $scope.distance(event.latLng, $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[3]);
                    infowindow4.setContent('To GC: ' + distance + 'yd');
                    if ($scope.showYardages[idx]) {
                        infowindow4.open($scope.myMaps[idx], gpsMarker.fifthMarker);
                    }
                });
                google.maps.event.addListener(gpsMarker.fifthMarker, 'click', function (event) {
                    var distance = $scope.distance2($scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[6], $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[3]);
                    infowindow4.setContent('To GC: ' + distance + 'yd');
                    if ($scope.showYardages[idx]) {
                        infowindow4.open($scope.myMaps[idx], gpsMarker.fifthMarker);
                    }
                });
            }
        };
        $scope.showHundredMarker = function (gpsMarker, idx, pos) {
            //100
            if (typeof gpsMarker.hundredMarker === 'undefined') {
                icon.url = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=10|FFFFFF|000000';
                gpsMarker.hundredMarker = new google.maps.Marker({
                    position: pos,
                    map: $scope.myMaps[idx],
                    icon: icon,
                    draggable: true,
                    title: "attack reference 100"
                });
                google.maps.event.addListener(gpsMarker.hundredMarker, 'drag', function (event) {
                    $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[7].latitude = event.latLng.lat();
                    $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[7].longitude = event.latLng.lng();
                    var distance = $scope.distance(event.latLng, $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[3]);
                    infowindow5.setContent('To GC: ' + distance + 'yd');
                    if ($scope.showYardages[idx]) {
                        infowindow5.open($scope.myMaps[idx], gpsMarker.hundredMarker);
                    }
                });
                google.maps.event.addListener(gpsMarker.hundredMarker, 'click', function (event) {
                    var distance = $scope.distance2($scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[7], $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[3]);
                    infowindow5.setContent('To GC: ' + distance + 'yd');
                    if ($scope.showYardages[idx]) {
                        infowindow5.open($scope.myMaps[idx], gpsMarker.hundredMarker);
                    }
                });
            }
        };

        $scope.showHundredfifthMarker = function (gpsMarker, idx, pos) {
            //150
            if (typeof gpsMarker.hundredfifthMarker === 'undefined') {
                icon.url = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=15|FFFFFF|000000';
                gpsMarker.hundredfifthMarker = new google.maps.Marker({
                    position: pos,
                    map: $scope.myMaps[idx],
                    icon: icon,
                    draggable: true,
                    title: "attack reference 150"
                });


                google.maps.event.addListener(gpsMarker.hundredfifthMarker, 'drag', function (event) {
                    $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[8].latitude = event.latLng.lat();
                    $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[8].longitude = event.latLng.lng();
                    var distance = $scope.distance(event.latLng, $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[3]);
                    infowindow6.setContent('To GC: ' + distance + 'yd');
                    if ($scope.showYardages[idx]) {
                        infowindow6.open($scope.myMaps[idx], gpsMarker.hundredfifthMarker);
                    }
                });
                google.maps.event.addListener(gpsMarker.hundredfifthMarker, 'click', function (event) {
                    var distance = $scope.distance2($scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[8], $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[$scope.holes[idx].number]].geoPoints[3]);
                    infowindow6.setContent('To GC: ' + distance + 'yd');
                    if ($scope.showYardages[idx]) {
                        infowindow6.open($scope.myMaps[idx], gpsMarker.hundredfifthMarker);
                    }
                });
            }
        };

        $scope.mapOverview = function (idx) {
            var mapOptions2 = {
                center: new google.maps.LatLng($scope.club.geoPoint.latitude, $scope.club.geoPoint.longitude),
                zoom: 16,
                tilt: 0,
                disableDefaultUI: true,
                disableDoubleClickZoom: true,
                scrollwheel: false,
                mapTypeId: google.maps.MapTypeId.SATELLITE,
                streetViewControl: false,
                zoomControl: true,
                //heading:90,
                zoomControlOptions: {
                    style: google.maps.ZoomControlStyle.SMALL
                }
            };
            var lineOptions = {
                //path: poi,
                geodesic: true,
                //map: $scope.myMap,
                strokeColor: '#FFFFFF',
                strokeOpacity: 0,
                icons: [{
                    icon: {
                        path: 'M 0,-1 0,1',
                        strokeOpacity: 1,
                        scale: 2
                    },
                    offset: '0',
                    repeat: '20px'
                }]
            };
            var myMapOverview = [];
            var markers = [];
            var line = [];
            var holesNum = $scope.club.holeSet2Infos[idx].holeIndexes.length;
            var bounds = new google.maps.LatLngBounds();
            myMapOverview[idx] = new google.maps.Map(document.getElementsByClassName('map-overviews')[idx], mapOptions2);
            $scope.clubLatLng = new google.maps.LatLng($scope.club.geoPoint.latitude, $scope.club.geoPoint.longitude);

            markers.push(new google.maps.Marker({
                position: $scope.clubLatLng,
                map: myMapOverview[idx],
                icon: '/GPS2/static/assets/static/tr.png',
                animation: google.maps.Animation.DROP
            }));


            for (var i = 0; i < holesNum; i++) {
                var geoPoint0 = $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[i]].geoPoints[0],
                    geoPoint1 = $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[i]].geoPoints[1],
                    geoPoint3 = $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[i]].geoPoints[3],
                    geoPoint2 = $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[i]].geoPoints[2],
                    geoPoint4 = $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[i]].geoPoints[4],
                    geoPoint6 = $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[i]].geoPoints[6],
                    geoPoint7 = $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[i]].geoPoints[7],
                    geoPoint8 = $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[i]].geoPoints[8],
                    iconNum = i + 1,
                    iconImg = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=' + iconNum + '|FF0000|FFFFFF';
                if (geoPoint0.latitude !== $scope.club.geoPoint.latitude && geoPoint1.latitude !== $scope.club.geoPoint.latitude && geoPoint2.latitude !== $scope.club.geoPoint.latitude && geoPoint3.latitude !== $scope.club.geoPoint.latitude && geoPoint4.latitude !== $scope.club.geoPoint.latitude && geoPoint6.latitude !== $scope.club.geoPoint.latitude && geoPoint7.latitude !== $scope.club.geoPoint.latitude && geoPoint8.latitude !== $scope.club.geoPoint.latitude) {

                    markers.push(new google.maps.Marker({
                        position: new google.maps.LatLng(geoPoint0.latitude, geoPoint0.longitude),
                        map: myMapOverview[idx],
                        icon: '/GPS2/static/assets/static/tee.png',
                        animation: google.maps.Animation.DROP
                    }));
                    markers.push(new google.maps.Marker({
                        position: new google.maps.LatLng(geoPoint1.latitude, geoPoint1.longitude),
                        map: myMapOverview[idx],
                        icon: iconImg,
                        animation: google.maps.Animation.DROP
                    }));
                    markers.push(new google.maps.Marker({
                        position: new google.maps.LatLng(geoPoint3.latitude, geoPoint3.longitude),
                        map: myMapOverview[idx],
                        icon: '/GPS2/static/assets/static/orange.png',
                        animation: google.maps.Animation.DROP
                    }));

                    var teeLatLng = new google.maps.LatLng(geoPoint0.latitude, geoPoint0.longitude);
                    var cgLatLng = new google.maps.LatLng(geoPoint1.latitude, geoPoint1.longitude);
                    var mgLatLng = new google.maps.LatLng(geoPoint3.latitude, geoPoint3.longitude);
                    //bounds.extend(teeLatLng).extend(cgLatLng).extend(mgLatLng);

                    //划线
                    line[i] = line[i] || new google.maps.Polyline(lineOptions);
                    line[i].setMap(null);
                    line[i].setPath([teeLatLng, cgLatLng, mgLatLng]);
                    line[i].setMap(myMapOverview[idx]);

                }
                for (var index in markers) {
                    var position = markers[index].position;
                    bounds.extend(position);
                }
                myMapOverview[idx].fitBounds(bounds);
            }

        };
        var infowindow1 = new google.maps.InfoWindow();
        var infowindow2 = new google.maps.InfoWindow();
        var infowindow3 = new google.maps.InfoWindow();
        var infowindow4 = new google.maps.InfoWindow();
        var infowindow5 = new google.maps.InfoWindow();
        var infowindow6 = new google.maps.InfoWindow();

        $scope.showYardages = [];

        $scope.holeClick = function (idx, hn) {
            $scope.mapOverview(idx);
            $scope.showMissingPin(idx, hn);

            var mapOptions = {
                center: new google.maps.LatLng($scope.club.geoPoint.latitude, $scope.club.geoPoint.longitude),
                zoom: 16,
                tilt: 0,
                disableDefaultUI: true,
                disableDoubleClickZoom: true,
                scrollwheel: false,
                mapTypeId: google.maps.MapTypeId.SATELLITE,
                streetViewControl: false,
                zoomControl: true,
                //heading:90,
                zoomControlOptions: {
                    style: google.maps.ZoomControlStyle.SMALL
                }
            };


            infowindow1.close();
            infowindow2.close();
            infowindow3.close();
            infowindow4.close();
            infowindow5.close();
            infowindow6.close();
            $('.custom-map-ck').eq(idx).bind('change', function () {
                if ($(this).is(':checked')) {
                    $scope.showYardages[idx] = true;
                } else {
                    $scope.showYardages[idx] = false;
                    infowindow1.close();
                    infowindow2.close();
                    infowindow3.close();
                    infowindow4.close();
                    infowindow5.close();
                    infowindow6.close();
                }
            });
            $scope.clubLatLng = new google.maps.LatLng($scope.club.geoPoint.latitude, $scope.club.geoPoint.longitude);

            var holeLatLng = $scope.club.holes[$scope.club.holeSet2Infos[idx].holeIndexes[hn]].geoPoints;

            if (typeof $scope.holes[idx] === 'undefined') {
                $scope.holes[idx] = {};
            }
            $scope.holes[idx].number = hn;
            $scope.holeIndex = hn;
            //console.log('param: ',hn);
            //初始化各标记的GPS数据
            var frontLatLng = '',
                backLatLng = '',
                mgLatLng = '',
                cgLatLng = '',
                fifthLatLng = '',
                hundredLatLng = '',
                hundredfifthLatLng = '',
                teeLatLng = '';

            //获取数据库数据
            if (typeof holeLatLng !== 'undefined') {
                if (!!holeLatLng[2].latitude && !!holeLatLng[2].longitude) {
                    frontLatLng = new google.maps.LatLng(holeLatLng[2].latitude, holeLatLng[2].longitude);
                }
                if (!!holeLatLng[4].latitude && !!holeLatLng[4].longitude) {
                    backLatLng = new google.maps.LatLng(holeLatLng[4].latitude, holeLatLng[4].longitude);
                }
                if (!!holeLatLng[3].latitude && !!holeLatLng[3].longitude) {
                    mgLatLng = new google.maps.LatLng(holeLatLng[3].latitude, holeLatLng[3].longitude);
                }
                if (!!holeLatLng[1].latitude && !!holeLatLng[1].longitude) {
                    cgLatLng = new google.maps.LatLng(holeLatLng[1].latitude, holeLatLng[1].longitude);
                }
                if (!!holeLatLng[0].latitude && !!holeLatLng[0].longitude) {
                    teeLatLng = new google.maps.LatLng(holeLatLng[0].latitude, holeLatLng[0].longitude);
                }
                if (!!holeLatLng[6].latitude && !!holeLatLng[6].longitude) {
                    fifthLatLng = new google.maps.LatLng(holeLatLng[6].latitude, holeLatLng[6].longitude);
                }
                if (!!holeLatLng[7].latitude && !!holeLatLng[7].longitude) {
                    hundredLatLng = new google.maps.LatLng(holeLatLng[7].latitude, holeLatLng[7].longitude);
                }
                if (!!holeLatLng[8].latitude && !!holeLatLng[8].longitude) {
                    hundredfifthLatLng = new google.maps.LatLng(holeLatLng[8].latitude, holeLatLng[8].longitude);
                }
            }
            $scope.gpsMarkers[idx] = $scope.gpsMarkers[idx] || {};
            var gpsMarker = $scope.gpsMarkers[idx];
            //Marker缺失标识
            !!$scope.showTee ? $scope.showTee.push(true) : $scope.showTee = [true];
            !!$scope.showCenter ? $scope.showCenter.push(true) : $scope.showCenter = [true];
            !!$scope.showGreenFront ? $scope.showGreenFront.push(true) : $scope.showGreenFront = [true];
            !!$scope.showGreenMiddle ? $scope.showGreenMiddle.push(true) : $scope.showGreenMiddle = [true];
            !!$scope.showGreenBack ? $scope.showGreenBack.push(true) : $scope.showGreenBack = [true];
            //点击地图添加Marker标识
            !!$scope.showWindow ? $scope.showWindow.push($scope.showTee[idx] || $scope.showCenter[idx] || $scope.showGreenFront[idx] || $scope.showGreenMiddle[idx] || $scope.showGreenBack[idx]) : $scope.showWindow = [$scope.showTee[idx] || $scope.showCenter[idx] || $scope.showGreenFront[idx] || $scope.showGreenMiddle[idx] || $scope.showGreenBack[idx]];
            //添加Map
            if (!$scope.myMaps[idx]) {
                $scope.myMaps[idx] = new google.maps.Map(document.getElementsByClassName('map-canvas')[idx], mapOptions);
            }

            var bounds = new google.maps.LatLngBounds();
            var polyline = new google.maps.Polyline($scope.lineOptions);


            if (frontLatLng.lat() === backLatLng.lat() || backLatLng.lat() === mgLatLng.lat() || mgLatLng.lat() === cgLatLng.lat() || cgLatLng.lat() === teeLatLng.lat() || teeLatLng.lat() === fifthLatLng.lat() || fifthLatLng.lat() === hundredLatLng.lat() || hundredLatLng.lat() === hundredfifthLatLng.lat()) {//无效
                !!$scope.clubLatLng ? $scope.myMaps[idx].setCenter($scope.clubLatLng) : null;
                $scope.myMaps[idx].setZoom(16);

                $scope.isNewHoleSet[idx] = true;
                $scope.missPin[hn] = true;


                if (gpsMarker.teeMarker) {
                    gpsMarker.teeMarker.setMap(null);
                    delete gpsMarker.teeMarker;
                }
                if (gpsMarker.greenFrontMarker) {
                    gpsMarker.greenFrontMarker.setMap(null);
                    delete gpsMarker.greenFrontMarker;
                }
                if (gpsMarker.greenMarker) {
                    gpsMarker.greenMarker.setMap(null);
                    delete gpsMarker.greenMarker;
                }
                if (gpsMarker.greenBackMarker) {
                    gpsMarker.greenBackMarker.setMap(null);
                    delete gpsMarker.greenBackMarker;
                }
                if (gpsMarker.centerMarker) {
                    gpsMarker.centerMarker.setMap(null);
                    delete gpsMarker.centerMarker;
                }
                if (gpsMarker.fifthMarker) {
                    gpsMarker.fifthMarker.setMap(null);
                    delete gpsMarker.fifthMarker;
                }
                if (gpsMarker.hundredMarker) {
                    gpsMarker.hundredMarker.setMap(null);
                    delete gpsMarker.hundredMarker;
                }
                if (gpsMarker.hundredfifthMarker) {
                    gpsMarker.hundredfifthMarker.setMap(null);
                    delete gpsMarker.hundredfifthMarker;
                }

                if ($scope.lines !== undefined && $scope.lines[idx] !== undefined) {
                    $scope.lines[idx].setMap(null);
                }


                $scope.addNewTeeMark = function (idx) {
                    var centerPos = $scope.myMaps[idx].getCenter();
                    $scope.showTeeMarker(gpsMarker, idx, centerPos);
                    if (gpsMarker.teeMarker !== undefined && gpsMarker.centerMarker !== undefined && gpsMarker.greenMarker !== undefined) {
                        $scope.drawLines(idx, [teeLatLng, cgLatLng, mgLatLng], [gpsMarker.teeMarker, gpsMarker.centerMarker, gpsMarker.greenMarker], $scope.myMaps[idx], polyline);
                    }
                };
                $scope.addNewGreenFrontMarker = function (idx) {
                    var centerPos = $scope.myMaps[idx].getCenter();
                    $scope.showGreenFrontMarker(gpsMarker, idx, centerPos);
                };

                $scope.addNewGreenMarker = function (idx) {
                    var centerPos = $scope.myMaps[idx].getCenter();
                    $scope.showGreenMarker(gpsMarker, idx, centerPos);
                    if (gpsMarker.teeMarker !== undefined && gpsMarker.centerMarker !== undefined && gpsMarker.greenMarker !== undefined) {
                        $scope.drawLines(idx, [teeLatLng, cgLatLng, mgLatLng], [gpsMarker.teeMarker, gpsMarker.centerMarker, gpsMarker.greenMarker], $scope.myMaps[idx], polyline);
                    }
                };
                $scope.addNewGreenBackMarker = function (idx) {
                    var centerPos = $scope.myMaps[idx].getCenter();
                    $scope.showGreenBackMarker(gpsMarker, idx, centerPos);
                };
                $scope.addNewCenterMarker = function (idx) {
                    var centerPos = $scope.myMaps[idx].getCenter();
                    $scope.showCenterMarker(gpsMarker, idx, centerPos);
                    if (gpsMarker.teeMarker !== undefined && gpsMarker.centerMarker !== undefined && gpsMarker.greenMarker !== undefined) {
                        $scope.drawLines(idx, [teeLatLng, cgLatLng, mgLatLng], [gpsMarker.teeMarker, gpsMarker.centerMarker, gpsMarker.greenMarker], $scope.myMaps[idx], polyline);
                    }
                };
                $scope.addNewFifthMarker = function (idx) {
                    var centerPos = $scope.myMaps[idx].getCenter();
                    $scope.showFifthMarker(gpsMarker, idx, centerPos);
                };
                $scope.addNewHundredMarker = function (idx) {
                    var centerPos = $scope.myMaps[idx].getCenter();
                    $scope.showHundredMarker(gpsMarker, idx, centerPos);
                };
                $scope.addNewHundredfifthMarker = function (idx) {
                    var centerPos = $scope.myMaps[idx].getCenter();
                    $scope.showHundredfifthMarker(gpsMarker, idx, centerPos);
                };


            } else {
                $scope.isNewHoleSet[idx] = false;


                $scope.showTeeMarker(gpsMarker, idx, teeLatLng);
                $scope.showGreenFrontMarker(gpsMarker, idx, frontLatLng);
                $scope.showGreenMarker(gpsMarker, idx, mgLatLng);
                $scope.showGreenBackMarker(gpsMarker, idx, backLatLng);
                $scope.showCenterMarker(gpsMarker, idx, cgLatLng);
                $scope.showFifthMarker(gpsMarker, idx, fifthLatLng);
                $scope.showHundredMarker(gpsMarker, idx, hundredLatLng);
                $scope.showHundredfifthMarker(gpsMarker, idx, hundredfifthLatLng);


                if (!!frontLatLng) {
                    $scope.showGreenFront[idx] = false;
                    bounds.extend(frontLatLng);
                    gpsMarker.greenFrontMarker.setPosition(frontLatLng);
                }
                if (!!backLatLng) {
                    $scope.showGreenBack[idx] = false;
                    bounds.extend(backLatLng);
                    gpsMarker.greenBackMarker.setPosition(backLatLng);
                }
                if (!!teeLatLng) {
                    $scope.showTee[idx] = false;
                    bounds.extend(teeLatLng);
                    gpsMarker.teeMarker.setPosition(teeLatLng);
                }
                if (!!mgLatLng) {
                    $scope.showGreenMiddle[idx] = false;
                    bounds.extend(mgLatLng);
                    gpsMarker.greenMarker.setPosition(mgLatLng);
                }
                if (!!cgLatLng) {
                    $scope.showCenter[idx] = false;
                    bounds.extend(cgLatLng);
                    gpsMarker.centerMarker.setPosition(cgLatLng);
                }
                if (!!fifthLatLng) {
                    bounds.extend(fifthLatLng);
                    gpsMarker.fifthMarker.setPosition(fifthLatLng);
                }
                if (!!hundredLatLng) {
                    bounds.extend(hundredLatLng);
                    gpsMarker.hundredMarker.setPosition(hundredLatLng);
                }
                if (!!hundredfifthLatLng) {
                    bounds.extend(hundredfifthLatLng);
                    gpsMarker.hundredfifthMarker.setPosition(hundredfifthLatLng);
                }

                //缩放地图
                $scope.myMaps[idx].fitBounds(bounds);

                //设置缺失Marker的初始位置
                var center;
                //中心点或club位置

                if (!frontLatLng && !backLatLng && !teeLatLng && !mgLatLng && !cgLatLng && !!$scope.clubLatLng) {
                    center = $scope.clubLatLng;
                }
                else if (!!$scope.showWindow) {
                    center = bounds.getCenter();
                }
                else {
                    return;
                }

                if (!frontLatLng) {
                    frontLatLng = center;
                    gpsMarker.greenFrontMarker.setPosition(center);
                    bounds.extend(center);
                }

                if (!backLatLng) {
                    backLatLng = center;
                    gpsMarker.greenBackMarker.setPosition(center);
                    bounds.extend(center);
                }

                if (!teeLatLng) {
                    teeLatLng = center;
                    gpsMarker.teeMarker.setPosition(center);
                    bounds.extend(center);
                }

                if (!mgLatLng) {
                    mgLatLng = center;
                    gpsMarker.greenMarker.setPosition(center);
                    bounds.extend(center);
                }

                if (!cgLatLng) {
                    cgLatLng = center;
                    gpsMarker.centerMarker.setPosition(center);
                    bounds.extend(center);
                }
                //连线
                //watch 三个点的状态
                $scope.drawLines(idx, [teeLatLng, cgLatLng, mgLatLng], [gpsMarker.teeMarker, gpsMarker.centerMarker, gpsMarker.greenMarker], $scope.myMaps[idx], polyline);
                $scope.myMaps[idx].fitBounds(bounds);
            }


        };
//连线选项
        $scope.lineOptions = {
            //path: poi,
            geodesic: true,
            //map: $scope.myMap,
            strokeColor: '#fff',
            strokeOpacity: 0,
            icons: [{
                icon: {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 1,
                    scale: 2
                },
                offset: '0',
                repeat: '20px'
            }]
        };

//连线 开球点->球道中心点->果岭中心点
        $scope.drawLines = function (idx, pois, markers, map, polyline) {
            !$scope.lines ? $scope.lines = [] : null;

            $scope.lines[idx] = $scope.lines[idx] || polyline;
            $scope.lines[idx].setPath(pois);
            $scope.lines[idx].setMap(map);

            markers.forEach(function (m, index) {
                google.maps.event.addListener(m, 'drag', function (e) {
                    pois[index] = e.latLng;
                    $scope.lines[idx].setPath(pois);
                });
            });
        };

    })
//默认显示第一洞GPS
    .
    directive('holeIndex1', function ($timeout) {
        return {
            restrict: 'A',
            scope: {
                index: '='
            },
            link: function (scope, elem, attrs) {
                elem.bind('click', function () {
                    elem.parents('.category').find('li').each(function (m) {
                        $(this).removeClass('active');
                    });
                    elem.parent().addClass('active');
                });
                //默认显示第一洞
                if (scope.index === 0) {
                    $timeout(function () {
                        elem.trigger('click');
                    }, 500)
                }
            }
        }
    })
    .directive('checkChange', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.bind('focus', function () {
                    //为空白字段设置初始值
                    if (!element.data('init')) {
                        element.data('init', '').unbind('focus');
                    }
                }).bind('change', function () {
                    var ele = angular.element(this),
                        init = ele.data('init'),
                        val = ele.val(),
                        label = ele.parent().parent().find('label');

                    if (init !== val) {
                        label.addClass('dataChanged');
                        label.bind('mouseenter', function () {
                            label.addClass('labelMouseIn');
                        }).bind('mouseleave', function () {
                            label.removeClass('labelMouseIn');
                        }).bind('click', function () {
                            ele.val(init);
                            label.removeClass('dataChanged labelMouseIn');
                        });
                    } else {
                        label.removeClass('dataChanged');
                        label.unbind();
                    }
                });
            }
        };
    })

    .directive('inputChange', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.bind('focus', function () {
                    //为空白字段设置初始值
                    if (!element.data('init')) {
                        element.data('init', '').unbind('focus');
                    }
                }).bind('change', function () {
                    var ele = angular.element(this),
                        init = ele.data('init') + '',
                        val = ele.val();

                    if (init !== val) {
                        ele.addClass('dataChanged');
                    } else {
                        ele.removeClass('dataChanged');
                    }
                });
            }
        };
    })

    .filter('isSelected', function () {
        return function (flag, flags) {
            if (flags.indexOf(flag) !== -1) return true;
            else return false;
        }
    })
    .filter('sex', function () {
        return function (input, type) {
            var out = [];

            for (var i = 0; (typeof input !== 'undefined') && i < input.length; i++) {
                var tee = input[i];
                if (tee.gender === type) out.push(tee);
            }

            return out;
        }
    })

    .filter('holeSet', function () {
        return function (input, type) {
            var out = [];

            for (var i = 0; i < input.length; i++) {
                var tee = input[i];
                if (tee[0] === type) out.push(tee);
            }

            return out;
        }
    })
    .filter('HoleSetFilter', function () {
        return function (input, outs, ins) {
            var out = [];
            for (var i = 0; (typeof input !== 'undefined') && i < input.length; i++) {
                if (typeof input[i] !== "undefined" && input[i] !== "" && input[i].name !== outs && input[i].name !== ins) {
                    out.push(input[i]);
                }
            }
            return out;
        };
    })
    .filter("toArray", function () {
        return function (obj) {
            var result = [];
            angular.forEach(obj, function (val, key) {
                result.push(val);
            });
            return result;
        };
    })
    .filter('clubDataFilter', function () {
        return function (input, outs, ins) {
            if (!input) {
                if (!outs)
                    return '';
                else
                    return outs;
            }
            else
                return input;
        };
    })


    .factory('clubConf', function () {
        return {
            //球场配套设施
            flagType: {
                0: 'mat driving range',
                1: 'putting green',
                2: 'chipping green',
                3: 'practice bunker',
                4: 'golf cart',
                5: 'pull cart',
                6: 'golf club rental',
                7: 'club fitting',
                8: 'pro shop',
                9: 'golf lessons',
                10: 'caddie hire',
                11: 'restaurant',
                12: 'receptions',
                13: 'changing room',
                14: 'locker room',
                15: 'lodging',
                16: 'grass driving range'
            }
        }
    });
