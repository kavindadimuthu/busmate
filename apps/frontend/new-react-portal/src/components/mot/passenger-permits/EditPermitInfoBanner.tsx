import { PassengerServicePermitResponse } from '@busmate/api-client-route';

interface EditPermitInfoBannerProps {
  permit: PassengerServicePermitResponse;
}

export function EditPermitInfoBanner({ permit }: EditPermitInfoBannerProps) {
  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
      <h3 className="text-sm font-medium text-primary mb-2">Current Permit Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-primary">
        <div>
          <span className="font-medium">Permit Number:</span>
          <span className="ml-2">{permit.permitNumber}</span>
        </div>
        <div>
          <span className="font-medium">Operator:</span>
          <span className="ml-2">{permit.operatorName}</span>
        </div>
        <div>
          <span className="font-medium">Route Group:</span>
          <span className="ml-2">{permit.routeGroupName}</span>
        </div>
        <div>
          <span className="font-medium">Status:</span>
          <span className="ml-2 capitalize">{permit.status}</span>
        </div>
        <div>
          <span className="font-medium">Type:</span>
          <span className="ml-2">{permit.permitType}</span>
        </div>
        <div>
          <span className="font-medium">Max Buses:</span>
          <span className="ml-2">{permit.maximumBusAssigned || 'Not specified'}</span>
        </div>
      </div>
    </div>
  );
}

export function EditPermitWarningNotes() {
  return (
    <div className="bg-warning/10 rounded-lg border border-warning/20 p-6">
      <h3 className="text-lg font-semibold text-warning mb-4">Important Notes</h3>
      <div className="text-sm text-warning space-y-2">
        <p>• Changing the operator or route group may affect existing bus assignments and schedules.</p>
        <p>• Reducing the maximum bus count may require reassigning excess buses.</p>
        <p>• Status changes should reflect the actual operational state of the permit.</p>
        <p>• Any changes will be logged and may require approval based on your organization&apos;s policies.</p>
      </div>
    </div>
  );
}
