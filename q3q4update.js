// Q3 implementation - replace in client/src/pages/events/overview.tsx lines 1764-1770
{/* Events */}
<div className="relative h-24 mb-6">
  {campData
    .filter(camp => {
      const startDate = new Date(camp.startDate);
      return startDate.getMonth() >= 6 && startDate.getMonth() <= 8; // Jul-Sep (6-8)
    })
    .map(camp => {
      const startDate = new Date(camp.startDate);
      const endDate = new Date(camp.endDate);
      
      // Calculate position and width
      const monthPercentage = 100 / 3; // 3 months per quarter
      const startMonth = startDate.getMonth() % 3; // 0-2 within the quarter
      const startDay = startDate.getDate();
      const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
      
      // Position based on month and day
      const leftPosition = (startMonth * monthPercentage) + 
        ((startDay / daysInMonth) * monthPercentage);
      
      // Width based on duration (days)
      const campDuration = camp.totalDays;
      const daysIn90Days = 90; // Approximate days in a quarter
      const widthPercentage = (campDuration / daysIn90Days) * 100;
      
      // Color based on status
      const bgColor = 
        camp.status === 'upcoming' ? 'bg-blue-50 border-blue-200' :
        camp.status === 'current' ? 'bg-green-50 border-green-200' :
        'bg-gray-50 border-gray-200';
      
      return (
        <div 
          key={camp.id}
          className={`absolute top-0 h-16 rounded-md ${bgColor} p-2 cursor-pointer`}
          style={{ 
            left: `${leftPosition}%`,
            width: `${widthPercentage}%`,
            minWidth: '80px'
          }}
          onClick={() => setSelectedCamp(camp)}
        >
          <div className="font-medium text-sm truncate">{camp.name}</div>
          <div className="text-xs text-gray-500">
            {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
          </div>
        </div>
      );
    })}
  {campData.filter(camp => {
    const startDate = new Date(camp.startDate);
    return startDate.getMonth() >= 6 && startDate.getMonth() <= 8;
  }).length === 0 && (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-sm text-gray-400 italic">No events scheduled</span>
    </div>
  )}
</div>

// Q4 implementation - replace in client/src/pages/events/overview.tsx lines 1787-1793
{/* Events */}
<div className="relative h-24 mb-6">
  {campData
    .filter(camp => {
      const startDate = new Date(camp.startDate);
      return startDate.getMonth() >= 9 && startDate.getMonth() <= 11; // Oct-Dec (9-11)
    })
    .map(camp => {
      const startDate = new Date(camp.startDate);
      const endDate = new Date(camp.endDate);
      
      // Calculate position and width
      const monthPercentage = 100 / 3; // 3 months per quarter
      const startMonth = startDate.getMonth() % 3; // 0-2 within the quarter
      const startDay = startDate.getDate();
      const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
      
      // Position based on month and day
      const leftPosition = (startMonth * monthPercentage) + 
        ((startDay / daysInMonth) * monthPercentage);
      
      // Width based on duration (days)
      const campDuration = camp.totalDays;
      const daysIn90Days = 90; // Approximate days in a quarter
      const widthPercentage = (campDuration / daysIn90Days) * 100;
      
      // Color based on status
      const bgColor = 
        camp.status === 'upcoming' ? 'bg-blue-50 border-blue-200' :
        camp.status === 'current' ? 'bg-green-50 border-green-200' :
        'bg-gray-50 border-gray-200';
      
      return (
        <div 
          key={camp.id}
          className={`absolute top-0 h-16 rounded-md ${bgColor} p-2 cursor-pointer`}
          style={{ 
            left: `${leftPosition}%`,
            width: `${widthPercentage}%`,
            minWidth: '80px'
          }}
          onClick={() => setSelectedCamp(camp)}
        >
          <div className="font-medium text-sm truncate">{camp.name}</div>
          <div className="text-xs text-gray-500">
            {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
          </div>
        </div>
      );
    })}
  {campData.filter(camp => {
    const startDate = new Date(camp.startDate);
    return startDate.getMonth() >= 9 && startDate.getMonth() <= 11;
  }).length === 0 && (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-sm text-gray-400 italic">No events scheduled</span>
    </div>
  )}
</div>