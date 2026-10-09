import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, resetKey: props.resetKey };
  }
  // Reset a failed route without remounting the persistent app shell on
  // every successful navigation (which also restarted profile/XP motion).
  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) {
      return { hasError: false, resetKey: props.resetKey };
    }
    return null;
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: 24, background: 'var(--color-background)',
        }}>
          <p style={{
            fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)',
          }}>
            Something went wrong. Please refresh the page.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
