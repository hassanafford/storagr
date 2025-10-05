# Unified Table Styling Guide

This document explains the unified CSS class system for consistent table styling across the application.

## CSS Classes

### Base Classes

1. **`.table-container`** - Wrapper for tables with responsive scrolling and styling
2. **`.unified-table`** - Base table styling with consistent appearance
3. **`.table-header-blue`** - Blue header styling with white text
4. **`.table-body`** - Table body styling with hover effects
5. **`.table-cell`** - Consistent cell padding and typography
6. **`.table-card`** - Card styling for mobile views
7. **`.table-empty-state`** - Styling for empty table states

### Text Alignment Classes

1. **`.table-cell-right`** - Right-aligned text
2. **`.table-cell-center`** - Center-aligned text
3. **`.table-cell-left`** - Left-aligned text

### Border Classes

1. **`.table-border-white`** - White borders
2. **`.table-border-gray`** - Gray borders

## Usage Examples

### Desktop Table

```jsx
<div className="hidden md:block table-container">
  <table className="unified-table">
    <thead className="table-header-blue">
      <tr>
        <th className="table-cell table-cell-right">Column 1</th>
        <th className="table-cell table-cell-right">Column 2</th>
      </tr>
    </thead>
    <tbody className="table-body">
      <tr>
        <td className="table-cell table-cell-right">Data 1</td>
        <td className="table-cell table-cell-right">Data 2</td>
      </tr>
    </tbody>
  </table>
  
  {data.length === 0 && (
    <div className="table-empty-state">
      <p>No data available</p>
    </div>
  )}
</div>
```

### Mobile Card View

```jsx
<div className="md:hidden">
  {data.length > 0 ? (
    <div className="space-y-4">
      {data.map(item => (
        <div key={item.id} className="table-card">
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium text-gray-700">Label:</div>
            <div className="text-gray-900">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="table-empty-state">
      <p>No data available</p>
    </div>
  )}
</div>
```

## Benefits

1. **Consistency** - All tables have the same appearance
2. **Maintainability** - Centralized styling in App.css
3. **Responsiveness** - Works on both desktop and mobile
4. **Accessibility** - Proper contrast and readable text
5. **Extensibility** - Easy to add new styles or modify existing ones

## Best Practices

1. Always use `.table-container` for desktop tables
2. Use `.table-card` for mobile card views
3. Apply `.table-empty-state` for empty table states
4. Use appropriate text alignment classes
5. Follow the semantic structure in the examples