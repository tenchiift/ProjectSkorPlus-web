import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
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
