/** @odoo-module **/

import {useService} from '@web/core/utils/hooks';
import {FormController} from '@web/views/form/form_controller';
import { _t } from '@web/core/l10n/translation';
// import {SideFormStatusIndicator} from './side_form_status_indicator';
import {onSideFormBeforeChange} from './hooks';

export class SideFormController extends FormController {

    setup() {
        super.setup(...arguments);
        this.actionService = useService('action');
        onSideFormBeforeChange(this.saveButtonClicked.bind(this))
    }

    open(inPopup = false) {
        const {params, ...context} = this.props.context;
        this.actionService.doAction({
            name: _t(`View Record`),
            res_model: this.props.resModel,
            res_id: this.props.resId,
            views: [[false, 'form']],
            type: 'ir.actions.act_window',
            view_mode: 'form',
            target: inPopup ? 'new' : 'current',
            context: context,
        });
    }

}

SideFormController.template = 'web_listview_side_formview.SideFormView';

SideFormController.components = {
    ...FormController.components,
    // SideFormStatusIndicator,
}
