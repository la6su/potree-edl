import Fetcher from '../utils/Fetcher';
import Panel from './Panel';
class FetcherPanel extends Panel {
  pendingRequests = 0;
  runningRequests = 0;
  completedRequests = 0;
  constructor(parentGui, instance) {
    super(parentGui, instance, 'Fetcher');
    this.updateValues();
    this.addController(this, 'pendingRequests').name('Pending requests');
  }
  updateValues() {
    const {
      pending
    } = Fetcher.getInfo();
    this.pendingRequests = pending;
  }
}
export default FetcherPanel;