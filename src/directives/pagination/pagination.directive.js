angular.module('adminPanel').directive('apPagination', [
    'AdminPanelConfig','$location',
    function(AdminPanelConfig,$location){
        return {
            restrict: 'AE',
            priority: 50,
            link: function(scope, elem, attr) {
                var Pagination = function(showPagesCount) {
                    this.currentPage = 1;
                    this.pageCount = 10;
                    this.pages = [];
                    this.activeLastFirst = false;
                    this.enableNextPage = false;
                    this.enablePreviousPage = false;
                    this.enableFirstPage = false;
                    this.enableLastPage = false;
                    this.bottomPage = 1;
                    this.topPage = showPagesCount;

                    var generatePages = function(first, last) {
                        var ret = [];
                        for(var i = first; i <= last; i++) {
                            ret.push(i);
                        }
                        return ret;
                    };
                    
                    this.rePaginate = function() {
                        var margin = Math.floor(showPagesCount / 2);
                        var generate = !((this.bottomPage === 1 && this.currentPage <= margin) ||
                                (this.topPage === this.pageCount && this.currentPage >= this.pageCount - margin));
                        if(generate) {
                            if(this.currentPage - margin < 1) {
                                this.bottomPage = 1;
                                this.topPage = this.activeLastFirst ? showPagesCount : this.pageCount;
                            } else if(this.currentPage + margin > this.pageCount) {
                                this.topPage = this.pageCount;
                                this.bottomPage = this.activeLastFirst ? this.pageCount - showPagesCount + 1 : 1;
                            } else {
                                this.topPage = this.currentPage + margin;
                                this.bottomPage = this.currentPage - margin;
                            }
                            this.pages = generatePages(this.bottomPage, this.topPage);
                        }
                    };

                    this.changePage = function(page) {
                        $location.search('page', page);
                        if(this.currentPage === page) return;
                        scope.$emit('pagination:changepage', page);
                        this.currentPage = page;
                        this.enableNextPage = (this.currentPage < this.pageCount);
                        this.enablePreviousPage = (this.currentPage > 1);
                        if(this.activeLastFirst) {
                            this.enableFirstPage = (this.currentPage > 1);
                            this.enableLastPage = (this.currentPage < this.pageCount);
                        }

                        this.rePaginate();
                    };

                    this.nextPage = function() {
                        if(page === this.pageCount) return;
                        var page = this.currentPage + 1;
                        this.changePage(page);
                    };

                    this.previousPage = function() {
                        if(page === 1) return;
                        var page = this.currentPage - 1;
                        this.changePage(page);
                    };

                    this.init = function(data) {
                        this.pageCount = data.totalPageCount;
                        this.currentPage = data.currentPageNumber;
                        this.activeLastFirst = (this.pageCount > showPagesCount);
                        this.enableNextPage = (this.currentPage < this.pageCount);
                        this.enableLastPage = (this.activeLastFirst && this.currentPage < this.pageCount);
                        this.bottomPage = 1;
                        this.topPage = this.activeLastFirst ? showPagesCount : this.pageCount;
                        this.pages = generatePages(this.bottomPage, this.topPage);
                    };
                    
                    this.reInit = function(data) {
                        this.pageCount = data.totalPageCount;
                        this.currentPage = data.currentPageNumber;
                        this.enableNextPage = (this.currentPage < this.pageCount);
                        this.enableLastPage = (this.activeLastFirst && this.currentPage < this.pageCount);
                        this.rePaginate();
                    };
                };
                scope.paginationInit = false;
                scope.pagination = new Pagination(AdminPanelConfig.pagination);
                
                scope.$on('pagination:paginate', function(e, data) {
                    if(scope.paginationInit) {
                        scope.pagination.reInit(data);
                    } else {
                        scope.paginationInit = true;
                        scope.pagination.init(data);
                    }
                });
            },
            templateUrl: 'directives/pagination/pagination.template.html'
        };
    }
]);

