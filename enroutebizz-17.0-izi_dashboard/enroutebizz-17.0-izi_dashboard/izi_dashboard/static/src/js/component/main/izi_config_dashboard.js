/** @odoo-module */

import Widget from "@web/legacy/js/core/widget";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import { jsonrpc } from "@web/core/network/rpc_service";

import IZISelectDashboard from "@izi_dashboard/js/component/main/izi_select_dashboard";
import IZIAddAnalysis from "@izi_dashboard/js/component/main/izi_add_analysis";
import IZIAutocomplete from "@izi_dashboard/js/component/general/izi_autocomplete";
var IZIConfigDashboard = Widget.extend({
    template: 'IZIConfigDashboard',
    events: {
        'click .izi_edit_layout': '_onClickEditLayout',
        'click .izi_embed_dashboard': '_onClickEmbedDashboard',
        'click .izi_share_dashboard': '_onClickShareDashboard',
        'click .izi_auto_layout': '_onClickAutoLayout',
        'click .izi_save_layout': '_onClickSaveLayout',
        'click .izi_select_dashboard': '_onClickSelectDashboard',
        'click .izi_edit_dashboard_input': '_onClickDashboardInput',
        'click .izi_edit_dashboard_button': '_onClickEditDashboard',
        'click .izi_save_dashboard_button': '_onClickSaveDashboard',
        'click .izi_delete_dashboard': '_onClickDeleteDashboard',
        'click .izi_add_analysis': '_onClickAddAnalysis',
        'click .izi_add_configuration': '_onClickAddConfig',
        'click .izi_export_configuration': '_onClickExportConfiguration',
        'click .izi_add_filter': '_onClickAddFilter',
        // 'keyup #izi_dashboard_ai_search_input': '_onKeyUpAISearchInput',
        'click #izi_export_capture': '_onClickExportCapture',
        'click .izi_select_theme': '_onClickSelectTheme',
        'click .izi_select_date_format': '_onClickSelectDateFormat',
        'click .izi_ai_generate': '_onClickAIGenerate',
        'click .izi_ai_explain': '_onClickAIExplain',
        'click .izi_ai_ask': '_onClickAIAsk',
        'click .izi_ai_slide': '_onClickAISlide',
    },

    /**
     * @override
     */
    init: function (parent, $viewDashboard) {
        var self = this;
        this._super.apply(this, arguments);
        self.parent = parent;
        if (parent.props) self.props = parent.props;
        self.$viewDashboard = $viewDashboard;
        self.$selectDashboard;
        self.selectedDashboard;
        self.selectedDashboardName;
        self.selectedDashboardWriteDate;
        self.selectedDashboardThemeName;
    },

    willStart: function () {
        var self = this;

        return this._super.apply(this, arguments).then(function () {
            return self.load();
        });
    },

    load: function () {
        var self = this;
    },

    render: function(){
        var self = this;
    },

    start: function() {
        var self = this;
        this._super.apply(this, arguments);
        
        self.$selectDashboard = self.$('.izi_select_dashboard');
        self.$titleDashboard = self.$('.izi_title_dashboard');
        self.$configDashboardContainer = self.$('.izi_config_dashboard_button_container');
        self.$editDashboard = self.$('.izi_edit_dashboard');
        self.$inputDashboard = self.$('.izi_edit_dashboard_input');
        self.$btnDashboardEdit = self.$('.izi_edit_dashboard_button');
        self.$btnDashboardSave = self.$('.izi_save_dashboard_button');
        self.$themeContainer = self.$('.izi_select_theme_container');
        self.$btnExportCapture = self.$('#izi_export_capture');
        self.$btnExportLoading = self.$('#izi_export_capture_loading');
        self.$btnEditLayout = self.$('.izi_edit_layout');
        self.$btnSaveLayout = self.$('.izi_save_layout');
        self.$btnAutoLayout = self.$('.izi_auto_layout');
        // Filter
        self.filterDateRange = {};
        self.filterDateRange.elm = self.$('#izi_dashboard_filter_date_range');
        self.filterDateRange.values = [null, null];
        self.filterDateFormat = {};
        self.filterDateFormat.elm = self.$('#izi_dashboard_filter_date_format');
        self.filterDateFormat.values = null;
        
        // Dynamic Filter
        self.$dynamicFiltersContainer = self.$('#izi_dynamic_filter_container');
        self.$dynamicFilters = {};

        // Dashboard Search
        self.$dashboardSearchContainer = self.$('#izi_dashboard_search_container .izi_dashboard_filter_content');
        
        // Load
        self._loadThemes();
        self._checkActionContext();
        self._initDashboard();

        // AI Search
        self.doneTypingInterval = 500;
        self.typingTimer;
        self.iziLabURL = '';
        self.iziDashboardAcessToken = '';
        self.baseUrl = window.location.origin;
        self.tableId = false;
        self.tableFieldNames = '';
        self.tableName = 'All';
    },

    /**
     * Private Method
     */
    _loadThemes: function (ev) {
        var self = this;
        self.$themeContainer.empty();
        jsonrpc('/web/dataset/call_kw/izi.dashboard.theme/search_read', {
            model: 'izi.dashboard.theme',
            method: 'search_read',
            args: [[], ['id', 'name'],],
            kwargs: {
                order: 'name asc',
            },
        }).then(function (results) {
            results.forEach(res => {
                self.$themeContainer.append(`<a theme-id="${res.id}" class="dropdown-item izi_select_theme izi_select_theme_${res.name}">${res.name}</a>`);
            });
        });
    },

    _checkActionContext: function() {
        var self = this;
        if (self.props) {
            if (self.props && self.props.context && self.props.context.dashboard_id) {
                self.selectedDashboard = self.props.context.dashboard_id;
            }
        }
    },

    _initDashboard: function (ev) {
        var self = this;
        var domain = []
        if (self.selectedDashboard) {
            domain = [['id', '=', self.selectedDashboard]]
        }
        jsonrpc('/web/dataset/call_kw/izi.dashboard/search_read', {
            model: 'izi.dashboard',
            method: 'search_read',
            args: [domain, ['id', 'name', 'write_date', 'theme_name', 'date_format', 'start_date', 'end_date', 'izi_lab_url', 'izi_dashboard_access_token', 'base_url', 'table_name']],
            kwargs: {},
        }).then(function (results) {
            if (results.length > 0) {
                self._selectDashboard(results[0].id, results[0].name, results[0].write_date, results[0].theme_name, results[0].date_format, results[0].start_date, results[0].end_date);
                self.iziLabURL = results[0].izi_lab_url;
                if (self.$viewDashboard && self.$viewDashboard.$viewDashboardAskContainer) {
                    var selectElm = self.$viewDashboard.$viewDashboardAskContainer.find('.izi_view_dashboard_ask_header_table .select2-choice')
                    selectElm.removeClass('select2-default');
                    selectElm.find('.select2-chosen').text(results[0].table_name || 'Undefined');
                }
                self.iziDashboardAcessToken = results[0].izi_dashboard_access_token;
                self.baseUrl = results[0].base_url;
                self._initDashboardAISearch();
                if (!self.iziLabURL) {
                    new swal('Warning', 'Please set IZI Lab URL in System Parameters', 'warning');
                }
            } else {
                if (self.$viewDashboard.$grid) {
                    self.$viewDashboard.$grid.removeAll();
                }
                self.$configDashboardContainer.hide();
                self.$titleDashboard.text('Select Dashboard');
                self.$selectDashboard.find('.izi_subtitle').text('Click to select existing dashboard or create a new one');
            }
        })
        jsonrpc('/web/dataset/call_kw/izi.dashboard/get_user_groups', {
            model: 'izi.dashboard',
            method: 'get_user_groups',
            args: [],
            kwargs: {},
        }).then(function(result){
            let user_group_dashboard = result['user_group_dashboard'] ?? '';
            let user_group_analysis = result['user_group_analysis'] ?? '';

            if (user_group_dashboard == 'User' && user_group_analysis != '') {
                $('.izi_add_analysis').hide();
                $('.izi_edit_layout').hide();
                $('.izi_delete_dashboard').hide();
            } else {
                $('.izi_add_analysis').show();
                $('.izi_edit_layout').show();
                $('.izi_delete_dashboard').show();
            }
        })

    },

    _initDashboardFilter: function() {
        var self = this;
        // Date Range
        // self.filterDateRange.elm.find('.izi_dashboard_filter_content').empty();
        self.filterDateRange.values = [null, null];
        var $dateFromElm = self.filterDateRange.elm.find('#izi_date_from');
        $dateFromElm.bootstrap_datepicker({
            language: "en",
            format: "yyyy-mm-dd",
            autoclose: true,
        });
        var $dateToElm = self.filterDateRange.elm.find('#izi_date_to');
        $dateToElm.bootstrap_datepicker({
            language: "en",
            format: "yyyy-mm-dd",
            autoclose: true,
        });
        $dateFromElm.off('change');
        $dateFromElm.on('change', function (ev) {
            var newValue = ev.currentTarget.value ? moment(ev.currentTarget.value).format('YYYY-MM-DD') : null;
            if (self.filterDateRange.values[0] != newValue) {
                self.filterDateRange.values[0] = newValue;
                self._loadFilteredDashboard();
            }
        });
        $dateToElm.off('change');
        $dateToElm.on('change', function (ev) {
            var newValue = ev.currentTarget.value ? moment(ev.currentTarget.value).format('YYYY-MM-DD') : null;
            if (self.filterDateRange.values[1] != newValue) {
                self.filterDateRange.values[1] = newValue;
                self._loadFilteredDashboard();
            }
        });
        // Initiate Dynamic Filter
        self.$dynamicFiltersContainer.empty();
        jsonrpc('/web/dataset/call_kw/izi.dashboard.filter/fetch_by_dashboard', {
            model: 'izi.dashboard.filter',
            method: 'fetch_by_dashboard',
            args: [[], [self.selectedDashboard]],
            kwargs: {},
        }).then(function (results) {
            results.forEach(function (filter) {
                if (results[0] == filter) {
                    self.$dynamicFiltersContainer.append(`
                        <div class="izi_dashboard_filter">
                            <div class="izi_dashboard_filter_title dropdown izi_dropdown">
                                <span class="material-icons-outlined">filter_alt</span>
                            </div>
                            <div class="izi_dashboard_filter_content">
                                <input type="hidden" class="izi_wfull izi_select2" id="filter_${filter.id}"/>
                            </div>
                        </div>`);
                } else {
                    self.$dynamicFiltersContainer.append(`
                        <div class="izi_dashboard_filter">
                            <input type="hidden" class="izi_wfull izi_select2" id="filter_${filter.id}"/>
                        </div>`);
                }
                if (filter.params) {
                    var $dF = new IZIAutocomplete(self, {
                        elm: self.$dynamicFiltersContainer.find(`#filter_${filter.id}`),
                        multiple: filter.selection_type == 'multiple' ? true : false,
                        placeholder: filter.name,
                        minimumInput: false,
                        params: filter.params,
                        onChange: function (values, name) {
                            self.$dynamicFilters[filter.id].values = values;
                            self._loadFilteredDashboard();
                        },
                    });
                } else {
                    var $dF = new IZIAutocomplete(self, {
                        elm: self.$dynamicFiltersContainer.find(`#filter_${filter.id}`),
                        multiple: filter.selection_type == 'multiple' ? true : false,
                        placeholder: filter.name,
                        minimumInput: false,
                        data: filter.values,
                        params: {
                            textField: 'name',
                        },
                        onChange: function (values, name) {
                            self.$dynamicFilters[filter.id].values = values;
                            self._loadFilteredDashboard();
                        },
                    });
                }
                self.$dynamicFilters[filter.id] = {
                    values: [],
                    elm: $dF,
                };
            });
        });

        // Reset Ask Chat
        if (self.$viewDashboard && self.$viewDashboard.$viewDashboardAsk) {
            self.$viewDashboard.$viewDashboardAsk.closest('.izi_view_dashboard_ask_container').hide();
            self.$viewDashboard.$viewDashboardAsk.empty();
            self.$viewDashboard.$viewDashboardAskChart.empty();
            self.$viewDashboard.ai_messages = self.$viewDashboard.default_ai_messages.slice();
        }
    },

    _initDashboardAISearch: function() {
        var self = this;
        self.$dashboardSearchContainer.empty();
        self.$dashboardSearchContainer.append(`
            <input id="izi_dashboard_search" class="izi_wfull izi_select2" placeholder="Input Keywords to Generate Analysis"/>
        `);
        new IZIAutocomplete(self, {
            elm: self.$dashboardSearchContainer.find(`#izi_dashboard_search`),
            multiple: true,
            placeholder: 'Dashboard Search',
            minimumInput: false,
            createSearchChoice: function(term, data) {
                if ($(data).filter(function() {
                    return this.name.localeCompare(term) === 0;
                }).length === 0) {
                    return {
                        id: 0,
                        name: term,
                        premium: 'Generate With AI',
                    };
                }
            },
            tags: true,
            api: {
                url: `${self.iziLabURL}/lab/analysis`,
                method: 'POST',
                body: {
                    'query': '',
                    'table_id': self.tableId,
                    'table_field_names': self.tableFieldNames,
                },
            },
            params: {
                textField: 'name',
            },
            onChange: function (values, name) {
                if (values.length > 0) {
                    var id = parseInt(values[0]);
                    var name = name;
                    self._getLabAnalysisConfig(id, name);
                }
            },
            formatFunc: function format(item) { 
                // return item[self.params.textField || 'name']; 
                var material_icon_html = '';
                var material_icon_html_right = '';
                if (item['visual_type_icon']) {
                    if (item['category'] || item['premium']) {
                        material_icon_html = `<span class="material-icons">${item['visual_type_icon']}</span>`
                    } else {
                        material_icon_html_right = `<span class="material-icons">${item['visual_type_icon']}</span>`
                    }
                }
                var category_html = '';
                if (item['category']) {
                    category_html = `<span>${item['category']}</span>`
                }
                var premium_html = '';
                if (false && item['premium']) {
                    premium_html = `<span class="izi_dashboard_option_premium">${item['premium']}</span>`
                }
                return `<div class="izi_dashboard_option">
                    <div class="izi_dashboard_option_header">
                        <div class="izi_dashboard_option_name">
                            ${material_icon_html}
                            ${item['name']}
                        </div>
                        <div class="izi_dashboard_option_category">
                            ${category_html}
                            ${premium_html}
                        </div>
                    </div>
                    <div class="izi_dashboard_option_visual">
                        ${material_icon_html_right}
                    </div>
                </div>`
            },
        });
    },

    _getLabAnalysisConfig: function (id, name) {
        var self = this;
        var body = {};
        $('.spinner-container').addClass('d-flex');
        jsonrpc('/web/dataset/call_kw/izi.dashboard/action_get_lab_analysis_config', {
            model: 'izi.dashboard',
            method: 'action_get_lab_analysis_config',
            args: [self.selectedDashboard, id, name],
            kwargs: {},
        }).then(function (res) {
            $('.spinner-container').removeClass('d-flex');
            if (res && res.status == 200) {
                self._initDashboard();
                if (res.success) {
                    new swal('Success', res.message, 'success');
                }
                setTimeout(function () {
                    self.$viewDashboard.$grid.float(false);
                    self.$viewDashboard.$grid.compact();
                    self.$viewDashboard.$grid.float(true);
                    $('.o_content').animate({ scrollTop: $('.izi_view_dashboard').height() }, 3000);
                    if (self.$viewDashboard && self.$viewDashboard.$grid) {
                        var layout = self.$viewDashboard.$grid.save(false)
                        if (layout) {
                            jsonrpc('/web/dataset/call_kw/izi.dashboard.block/ui_save_layout', {
                                model: 'izi.dashboard.block',
                                method: 'ui_save_layout',
                                args: [layout],
                                kwargs: {},
                            }).then(function (result) {
                                if (result.status == 200) {
                                }
                            })
                        }
                    }
                }, 1000);
            } else {
                self._initDashboard();
                if (res.status == 401) {
                    new swal('Need Access', res.message, 'warning');
                    self._getOwl().action.doAction({
                        type: 'ir.actions.act_window',
                        name: _t('Need API Access'),
                        target: 'new',
                        res_model: 'izi.lab.api.key.wizard',
                        views: [[false, 'form']],
                        context: {},
                    },{
                        onClose: function(){
                            // self._initDashboard();
                        }
                    });
                } else
                    new swal('Error', res.message, 'error');
            }
        });
        
    },

    _onKeyUpAISearchInput: function(ev) {
        var self = this;
        if (ev.key === 'Enter' || ev.keyCode === 13) {
            var deletePreviousAnalysis = false;
            var keyword = $(ev.currentTarget).val();
            clearTimeout(self.typingTimer);
            self.typingTimer = setTimeout(function () {
                console.log('AI is generating...');
                jsonrpc('/web/dataset/call_kw/izi.dashboard/action_ai_search', {
                    model: 'izi.dashboard',
                    method: 'action_ai_search',
                    args: [self.selectedDashboard, keyword, deletePreviousAnalysis],
                    kwargs: {},
                }).then(function (res) {
                    if (res && res.status == 200) {
                        self._initDashboard();
                        setTimeout(function () {
                            self.$viewDashboard.$grid.float(false);
                            self.$viewDashboard.$grid.compact();
                            self.$viewDashboard.$grid.float(true);
                            if (self.$viewDashboard && self.$viewDashboard.$grid) {
                                var layout = self.$viewDashboard.$grid.save(false)
                                if (layout) {
                                    jsonrpc('/web/dataset/call_kw/izi.dashboard.block/ui_save_layout', {
                                        model: 'izi.dashboard.block',
                                        method: 'ui_save_layout',
                                        args: [layout],
                                        kwargs: {},
                                    }).then(function (result) {
                                        if (result.status == 200) {
                                        }
                                    })
                                }
                                
                            }
                        }, 1000);
                    } else {
                        new swal('Error', res.message, 'error');
                    }
                });
            }, self.doneTypingInterval);
        }
    },

    _onClickAIGenerate: function(ev) {
        var self = this;
        // Check if izi_dashboard_search_container is visible
        if (self.$('#izi_dashboard_search_container').is(':visible')) {
            self.$('#izi_dashboard_search_container').hide();
            self.$('#izi_dynamic_filter_container').show();
            self.$('#izi_dashboard_filter_date_format').show();
        } else {
            self.$('#izi_dashboard_search_container').show();
            self.$('#izi_dynamic_filter_container').hide();
            self.$('#izi_dashboard_filter_date_format').hide();
        }
    },

    _hideAIGenerate: function(ev) {
        var self = this;
        self.$('#izi_dashboard_search_container').hide();
        self.$('#izi_dynamic_filter_container').show();
        self.$('#izi_dashboard_filter_date_format').show();
    },

    _onClickAIAsk: function(ev) {
        var self = this;
        // new swal('Information', `This is a beta feature not included in the App Store version. Please contact us to access the full features of our AI.`, 'warning');
        var $container = self.$viewDashboard.$viewDashboardAsk.closest('.izi_view_dashboard_ask_container');
        self.$viewDashboard.$viewDashboardAsk.empty();
        if ($container.is(":visible")) {
            $container.hide();
        } else {
            $container.slideDown();
            self.$viewDashboard._renderAIMessages();
        }
    },

    _onClickAIExplain: function(ev) {
        var self = this;
        new swal({
            title: "Confirmation",
            text: `
                Do you confirm to generate the explanation with AI?
                It will take a few minutes to finish the process.
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: 'Yes',
            heightAuto : false,
        }).then((result) => {
            if (result.isConfirmed) {
                self._loadFilteredDashboard('ai_analysis');
            }
        });
    },

    _onClickSelectDateFormat: function(ev) {
        var self = this;
        self.filterDateFormat.values = $(ev.currentTarget).data('date_format');
        var text = $(ev.currentTarget).text();
        self.filterDateFormat.elm.find('.izi_dashboard_filter_content .dropdown-toggle').text(text);
        if (self.filterDateFormat.values == 'custom') {
            self.filterDateRange.elm.show();
        } else {
            self.filterDateRange.elm.hide();
            self._loadFilteredDashboard();
        }
    },
    
    _loadFilteredDashboard: function(mode=false) {
        var self = this;
        var filters = {};
        if (self.filterDateFormat.values) {
            filters.date_format = self.filterDateFormat.values;
            if (self.filterDateFormat.values == 'custom') {
                filters.date_range = self.filterDateRange.values;
            }
        }
        if (self.$dynamicFilters) {
            filters.dynamic = [];
            for (var key in self.$dynamicFilters) {
                filters.dynamic.push({
                    filter_id: parseInt(key),
                    values: self.$dynamicFilters[key].values,
                });
            }
        }
        if (self.selectedDashboard && self.$viewDashboard) {
            self.$viewDashboard._setDashboard(self.selectedDashboard);
            self.$viewDashboard._loadDashboard(filters, mode);
        }
    },

    _onClickSelectTheme: function (ev) {
        var self = this;
        var theme_id = parseInt($(ev.currentTarget).attr('theme-id'));
        var theme_name = $(ev.currentTarget).text();
        if (theme_id && theme_name) {
            new swal({
                title: "Change confirmation",
                text: `
                    Do you confirm to change the dashboard theme?
                `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: 'Yes',
                heightAuto : false,
            }).then((result) => {
                if (result.isConfirmed) {
                    var data = {
                        'theme_id': theme_id,
                    }
                    jsonrpc('/web/dataset/call_kw/izi.dashboard/write', {
                        model: 'izi.dashboard',
                        method: 'write',
                        args: [self.selectedDashboard, data],
                        kwargs: {},
                    }).then(function (result) {
                        new swal('Success', `Dashboard theme has been changed successfully`, 'success');
                        amChartsTheme.applyTheme(theme_name);
                        $(".dropdown-item.izi_select_theme").removeClass("active");
                        $(ev.currentTarget).addClass("active");

                        if (self.selectedDashboard && self.$viewDashboard) {
                            self._loadFilteredDashboard()
                        }
                    });
                }
            });
        }
    },

    _onClickEditLayout: function(ev) {
        var self = this;
        self.$btnEditLayout.hide();
        self.$btnSaveLayout.show();
        self.$btnAutoLayout.show();
        self.$dynamicFiltersContainer.hide();
        self.$viewDashboard.$grid.enable(); //enable widgets moving/resizing.
        self.$viewDashboard.$el.addClass('izi_edit_mode');
    },
    _onClickEmbedDashboard: function(ev) {
        var self = this;
        jsonrpc('/web/dataset/call_kw/izi.dashboard/generate_access_token', {
            model: 'izi.dashboard',
            method: 'generate_access_token',
            args: [self.selectedDashboard],
            kwargs: {},
        }).then(function (access_token) {
            if (access_token) {
                self.iziDashboardAcessToken = access_token;
                var url = `${self.baseUrl}/izi/dashboard/${self.selectedDashboard}/page?access_token=${self.iziDashboardAcessToken}`
                var html = `<iframe src="${url}" width="100%" height="100%" frameborder="0"></iframe>`;
                new swal({
                    title: "Embed Dashboard",
                    text: html,
                    icon: "info",
                    showCancelButton: true,
                    confirmButtonText: 'Copy',
                    heightAuto : false,
                }).then((result) => {
                    if (result.isConfirmed) {
                        var $temp = $("<input>");
                        $("body").append($temp);
                        $temp.val(html).select();
                        document.execCommand("copy");
                        $temp.remove();
                        new swal('Success', `Embed code has been copied to clipboard`, 'success');
                    }
                });
            }
        });
    },

    _onClickShareDashboard: function(ev) {
        var self = this;
        jsonrpc('/web/dataset/call_kw/izi.dashboard/generate_access_token', {
            model: 'izi.dashboard',
            method: 'generate_access_token',
            args: [self.selectedDashboard],
            kwargs: {},
        }).then(function (access_token) {
            if (access_token) {
                self.iziDashboardAcessToken = access_token;
                var url = `${self.baseUrl}/izi/dashboard/${self.selectedDashboard}/page?access_token=${self.iziDashboardAcessToken}`
                new swal({
                    title: "Share Dashboard",
                    text: url,
                    icon: "info",
                    showCancelButton: true,
                    confirmButtonText: 'Copy',
                    heightAuto : false,
                }).then((result) => {
                    if (result.isConfirmed) {
                        var $temp = $("<input>");
                        $("body").append($temp);
                        $temp.val(url).select();
                        document.execCommand("copy");
                        $temp.remove();
                        new swal('Success', `Embed code has been copied to clipboard`, 'success');
                    }
                });
            }
        });
    },

    _onClickAutoLayout: function(ev) {
        var self = this;
        self.$viewDashboard.$grid.float(false);
        self.$viewDashboard.$grid.compact();
        self.$viewDashboard.$grid.float(true);
    },

    _onClickSaveLayout: function(ev) {
        var self = this;
        if (self.$viewDashboard && self.$viewDashboard.$grid) {
            var layout = self.$viewDashboard.$grid.save(false)
            if (layout) {
                jsonrpc('/web/dataset/call_kw/izi.dashboard.block/ui_save_layout', {
                    model: 'izi.dashboard.block',
                    method: 'ui_save_layout',
                    args: [layout],
                    kwargs: {},
                }).then(function (result) {
                    if (result.status == 200) {
                        self.$btnEditLayout.show();
                        self.$btnSaveLayout.hide();
                        self.$btnAutoLayout.hide();
                        self.$dynamicFiltersContainer.show();
                        self.$viewDashboard.$grid.disable(); //Disables widgets moving/resizing.
                        self.$viewDashboard.$el.removeClass('izi_edit_mode');
                        self._loadFilteredDashboard();
                        new swal('Success', `Dashboard layout has been saved successfully.`, 'success');
                    }
                })
            }
            
        }
    },

    _onClickSelectDashboard: function (ev) {
        var self = this;
        // Add Dialog
        var $select = new IZISelectDashboard(self)
        $select.appendTo($('body'));
    },

    _selectDashboard: function (id, name, write_date, theme_name, date_format, start_date, end_date) {
        var self = this;
        self.selectedDashboard = id;
        self.selectedDashboardName = name;
        self.selectedDashboardWriteDate = write_date;
        self.selectedDashboardThemeName = theme_name;
        self.$titleDashboard.text(name);
        var text = self.filterDateFormat.elm.find(`[data-date_format="${!(date_format) ? '' : date_format}"]`).text()
        self.filterDateFormat.elm.find('.izi_dashboard_filter_content .dropdown-toggle').text(text);
        if (date_format == 'custom' && (start_date || end_date)) {
            self.filterDateFormat.values = date_format;
            self.filterDateRange.values = [start_date, end_date]
            self.filterDateRange.elm.find('#izi_date_from').val(start_date)
            self.filterDateRange.elm.find('#izi_date_to').val(end_date)
            self.filterDateRange.elm.show();
        } else if (date_format) {
            self.filterDateFormat.values = date_format;
            self.filterDateRange.elm.find('#izi_date_from').val('')
            self.filterDateRange.elm.find('#izi_date_to').val('')
            self.filterDateRange.elm.hide();
        } else {
            self.filterDateFormat.values = null;
            self.filterDateRange.values = [null, null];
            self.filterDateRange.elm.find('#izi_date_from').val('')
            self.filterDateRange.elm.find('#izi_date_to').val('')
            self.filterDateRange.elm.hide();
        }
        self.$selectDashboard.find('.izi_subtitle').text(moment(write_date).format('LLL'));
        if (self.$viewDashboard) {  
            self.$configDashboardContainer.show();
            self._loadFilteredDashboard();
            $(".dropdown-item.izi_select_theme").removeClass("active");
            self.$(`.izi_select_theme_${theme_name}`).addClass("active");
            amChartsTheme.applyTheme(theme_name);
        }
        self._initDashboardFilter();
    },

    _onClickEditDashboard: function(ev) {
        var self = this;
        ev.stopPropagation();
        if (self.selectedDashboard && self.$btnDashboardEdit.is(":visible")) {
            self.$titleDashboard.hide();
            self.$inputDashboard.val(self.$titleDashboard.text());
            self.$editDashboard.show();
            self.$btnDashboardEdit.hide();
            self.$btnDashboardSave.show();
        }
    },

    _onClickSaveDashboard: function(ev) {
        var self = this;
        ev.stopPropagation();
        var name = self.$inputDashboard.val();
        if (self.selectedDashboard && name) {
            new swal({
                title: "Edit Confirmation",
                text: `
                    Do you confirm to change the dashboard information?
                `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: 'Yes',
                heightAuto : false,
            }).then((result) => {
                if (result.isConfirmed) {
                    var data = {
                        'name': name,
                    }
                    jsonrpc('/web/dataset/call_kw/izi.dashboard/write', {
                        model: 'izi.dashboard',
                        method: 'write',
                        args: [self.selectedDashboard, data],
                        kwargs: {},
                    }).then(function (result) {
                        new swal('Success', `Dashboard has been saved successfully`, 'success');
                        self.$titleDashboard.text(name);
                        self.$titleDashboard.show();
                        self.$editDashboard.hide();
                        self.$btnDashboardEdit.show();
                        self.$btnDashboardSave.hide();
                    });
                }
            });
        }
    },

    _onClickDeleteDashboard: function(ev) {
        var self = this;
        ev.stopPropagation();
        if (self.selectedDashboard) {
            new swal({
                title: "Delete Confirmation",
                text: `
                    Do you confirm to delete the dashboard ?
                `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: 'Yes',
                heightAuto : false,
            }).then((result) => {
                if (result.isConfirmed) {
                    var data = {
                        'name': name,
                    }
                    jsonrpc('/web/dataset/call_kw/izi.dashboard/unlink', {
                        model: 'izi.dashboard',
                        method: 'unlink',
                        args: [self.selectedDashboard],
                        kwargs: {},
                    }).then(function (result) {
                        new swal('Success', `Dashboard has been deleted successfully`, 'success');
                        self._initDashboard();
                    });
                }
            });
        }
    },

    _onClickAddFilter: function (ev) {
        var self = this;
        self._hideAIGenerate();
        if (self.selectedDashboard) {
            var self = this;
            self._getOwl().action.doAction({
                type: 'ir.actions.act_window',
                name: _t('Dashboard'),
                target: 'new',
                res_id: self.selectedDashboard,
                res_model: 'izi.dashboard',
                views: [[false, 'form']],
                context: { 'active_test': false },
            },{
                onClose: function(){
                    self._initDashboard();
                },
            });
        }
    },

    _onClickAISlide: function(ev) {
        var self = this;
        self._hideAIGenerate();
        if (self.selectedDashboard) {
            var self = this;
            jsonrpc('/web/dataset/call_kw/izi.dashboard/action_check_key', {
                model: 'izi.dashboard',
                method: 'action_check_key',
                args: [],
                kwargs: {},
            }).then(function (result) {
                if (result.status == 200) {
                    self._getOwl().action.doAction({
                        type: 'ir.actions.act_window',
                        name: _t('Dashboard'),
                        target: 'new',
                        res_id: self.selectedDashboard,
                        res_model: 'izi.dashboard',
                        views: [[false, 'form']],
                        context: { 'active_test': false },
                    },{
                        onClose: function(){
                            self._initDashboard();
                        },
                    });
                } else {
                    if (result.status == 401) {
                        new swal('Need Access', result.message, 'warning');
                        self._getOwl().action.doAction({
                            type: 'ir.actions.act_window',
                            name: _t('Need API Access'),
                            target: 'new',
                            res_model: 'izi.lab.api.key.wizard',
                            views: [[false, 'form']],
                            context: {},
                        },{
                            onClose: function(){
                            }
                        });
                    } else if (result.status == 500) {
                        new swal('Error', result.message, 'error');
                    } else
                        new swal('Error', result.message, 'error');
                }
            });
        }
    },

    _onClickAddAnalysis: function (ev) {
        var self = this;
        self._hideAIGenerate();
        // ev.stopPropagation();
        if (self.selectedDashboard) {
            var self = this;
            // Add Dialog
            var $select = new IZIAddAnalysis(self)
            $select.appendTo($('body'));
        }
    },

    _onClickExportConfiguration: function (ev) {
        var self = this;
        self._hideAIGenerate();
        var dashboard_id = self.selectedDashboard
        // debugger
        jsonrpc('/web/dataset/call_kw/izi.dashboard/export_all_config', {
            model: 'izi.dashboard',
            method: 'export_all_config',
            args: [dashboard_id],
            kwargs: {},
        }).then(function (attachment_id) {
            window.open('/web/content/' + attachment_id + '?download=true', '_blank');
        });
    },

    _onClickAddConfig: function (ev) {
        var self = this;
        self._hideAIGenerate();
        // Open Configuration Wizard
        if (self.selectedDashboard) {
            self._getOwl().action.doAction({
                type: 'ir.actions.act_window',
                name: _t('Dashboard'),
                target: 'new',
                res_model: 'izi.dashboard.config.wizard',
                views: [[false, 'form']],
                context: { 'default_dashboard_id': self.selectedDashboard },
            },{
                onClose: function(){
                    self._initDashboard();
                }
            });
        }
    },
    
    _onClickExportCapture: function (ev) {
        var self = this;
        self.$btnExportCapture.hide();
        self.$btnExportLoading.show();

        ev.stopPropagation();
        if (self.selectedDashboard) {
            // self.$captureContainer.on('click', function(){
            var btn = $(self).button('loading');
            html2canvas(document.querySelector('.izi_view_dashboard'), {useCORS: true, allowTaint: false}).then(function(canvas){
                window.jsPDF = window.jspdf.jsPDF;
                var doc = new jsPDF("p", "mm", "a4");
                var img = canvas.toDataURL("image/jpeg", 0.90);
                var imgProps= doc.getImageProperties(img);
                var pageHeight = 295;
                var width = doc.internal.pageSize.getWidth();
                var height = (imgProps.height * width) / imgProps.width;
                var heightLeft = height;
                var position = 0;
                
                doc.addImage(img,'JPEG', 0, 0, width, height, 'FAST');
                heightLeft -= pageHeight;
                while (heightLeft >= 0) {
                    position = heightLeft - height;
                    doc.addPage();
                    doc.addImage(img, 'JPEG', 0, position,  width, height, 'FAST');
                    heightLeft -= pageHeight;
                };
                doc.save(self.$titleDashboard[0].innerHTML + '.pdf');
                new swal('Success', `Dashboard has been Captured.`, 'success');
                btn.button('reset');

                self.$btnExportCapture.show();
                self.$btnExportLoading.hide();
            });
            // });
        } 
    },

    _onClickDashboardInput: function(ev) {
        var self = this;
        ev.stopPropagation();
    },

    _getOwl: function() {
        var cur_obj = this;
        while (cur_obj) {
            if (cur_obj.__owl__) {
                return cur_obj;
            }
            cur_obj = cur_obj.parent;
        }
        return undefined;
    },
});

export default IZIConfigDashboard;