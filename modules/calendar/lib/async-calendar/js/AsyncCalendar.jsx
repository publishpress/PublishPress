import NavigationBar from "./NavigationBar";
import WeekDays from "./WeekDays";
import MessageBar from "./MessageBar";
import CalendarCell from "./CalendarCell";
import {calculateWeeksInMilliseconds, getBeginDateOfWeekByDate, getDateAsStringInWpFormat} from "./Functions";
import FilterBar from "./FilterBar";

const {__} = wp.i18n;
const $ = jQuery;

export default function AsyncCalendar(props) {
    const theme = (props.theme || 'light');

    const [firstDateToDisplay, setFirstDateToDisplay] = React.useState(getBeginDateOfWeekByDate(props.firstDateToDisplay));
    const [numberOfWeeksToDisplay, setNumberOfWeeksToDisplay] = React.useState(props.numberOfWeeksToDisplay);
    const [itemsByDate, setItemsByDate] = React.useState(props.items);
    const [isLoading, setIsLoading] = React.useState(false);
    const [message, setMessage] = React.useState();
    const [filterStatus, setFilterStatus] = React.useState();
    const [filterCategory, setFilterCategory] = React.useState();
    const [filterTag, setFilterTag] = React.useState();
    const [filterAuthor, setFilterAuthor] = React.useState();
    const [filterPostType, setFilterPostType] = React.useState();
    const [filterWeeks, setFilterWeeks] = React.useState(props.numberOfWeeksToDisplay);
    const [openedItemId, setOpenedItemId] = React.useState();
    const [openedItemData, setOpenedItemData] = React.useState([]);

    const getUrl = (action, query) => {
        if (!query) {
            query = '';
        }

        return props.ajaxUrl + '?action=' + action + '&nonce=' + props.nonce + query;
    }

    const addEventListeners = () => {
        window.addEventListener('PublishpressCalendar:clickItem', onClickItem);
        window.addEventListener('PublishpressCalendar:refreshItemPopup', onRefreshItemPopup);
        document.addEventListener('keydown', onDocumentKeyDown);
    }

    const removeEventListeners = () => {
        window.removeEventListener('PublishpressCalendar:clickItem', onClickItem);
        window.removeEventListener('PublishpressCalendar:refreshItemPopup', onRefreshItemPopup);
        document.removeEventListener('keydown', onDocumentKeyDown);
    }

    const didUnmount = () => {
        removeEventListeners();
    }

    const didMount = () => {
        addEventListeners();

        return didUnmount;
    }

    const loadDataByDate = (newDate, filtersOverride) => {
        setIsLoading(true);
        setMessage(__('Loading...', 'publishpress'));

        fetchData(newDate, filtersOverride).then((fetchedData) => {
            setFirstDateToDisplay(newDate);
            setItemsByDate(fetchedData);
            setIsLoading(false);
            setMessage(null);

            resetCSSClasses();
        });
    };

    const resetCSSClasses = () => {
        $('.publishpress-calendar-day-hover').removeClass('publishpress-calendar-day-hover');
        $('.publishpress-calendar-loading').removeClass('publishpress-calendar-loading');
    };

    const fetchData = async (newDate, filtersOverride) => {
        if (!filtersOverride) {
            filtersOverride = {filterName: null, filterValue: null};
        }

        const numberOfWeeksToDisplayOverride = (filtersOverride.filterName === 'weeks') ? (filtersOverride.filterValue || numberOfWeeksToDisplay) : numberOfWeeksToDisplay;

        let dataUrl = getUrl(props.actionGetData, '&start_date=' + getDateAsStringInWpFormat(getBeginDateOfWeekByDate(newDate || firstDateToDisplay )) + '&number_of_weeks=' + numberOfWeeksToDisplayOverride);

        const filterStatusValue = (filtersOverride.filterName === 'status' && filtersOverride.filterValue) || filterStatus;
        if (filterStatusValue) {
            dataUrl += '&post_status=' + filterStatusValue;
        }

        const filterCategoryValue = (filtersOverride.filterName === 'category' && filtersOverride.filterValue) || filterCategory;
        if (filterCategoryValue) {
            dataUrl += '&category=' + filterCategoryValue;
        }

        const filterTagValue = (filtersOverride.filterName === 'tag' && filtersOverride.filterValue) || filterTag;
        if (filterTagValue) {
            dataUrl += '&post_tag=' + filterTagValue;
        }

        const filterAuthorValue = (filtersOverride.filterName === 'author' && filtersOverride.filterValue) || filterAuthor;
        if (filterAuthorValue) {
            dataUrl += '&post_author=' + filterAuthorValue;
        }

        const filterPostTypeValue = (filtersOverride.filterName === 'postType' && filtersOverride.filterValue) || filterPostType;
        if (filterPostTypeValue) {
            dataUrl += '&post_author=' + filterPostTypeValue;
        }

        const filterWeeksValue = (filtersOverride.filterName === 'weeks' && filtersOverride.filterValue) || filterWeeks;
        if (filterWeeksValue) {
            dataUrl += '&weeks=' + filterWeeksValue;
        }

        const response = await fetch(dataUrl);
        return await response.json();
    }

    const fetchItemData = async (id) => {
        const dataUrl = props.ajaxUrl + '?action=' + 'publishpress_calendar_get_post_data' + '&nonce=' + props.nonce + '&id=' + id;
        const response = await fetch(dataUrl);
        return await response.json();
    }

    const navigateByOffsetInWeeks = (offsetInWeeks) => {
        loadDataByDate(new Date(firstDateToDisplay.getTime() + calculateWeeksInMilliseconds(offsetInWeeks)));
    };

    const handleRefreshOnClick = (e) => {
        e.preventDefault();

        loadDataByDate(firstDateToDisplay);
    };

    const handleBackPageOnClick = (e) => {
        e.preventDefault();

        navigateByOffsetInWeeks(numberOfWeeksToDisplay * -1);
    };

    const handleBackOnClick = (e) => {
        e.preventDefault();

        navigateByOffsetInWeeks(-1);
    };

    const handleForwardOnClick = (e) => {
        e.preventDefault();

        navigateByOffsetInWeeks(1);
    }

    const handleForwardPageOnClick = (e) => {
        e.preventDefault();

        navigateByOffsetInWeeks(numberOfWeeksToDisplay);
    };

    const handleTodayOnClick = (e) => {
        e.preventDefault();

        const newDate = getBeginDateOfWeekByDate(props.todayDate, props.weekStartsOnSunday);

        loadDataByDate(newDate);
    };

    const getItemByDateAndIndex = (date, index) => {
        return itemsByDate[date][index];
    };

    const moveItemToNewDate = async (itemDate, itemIndex, newYear, newMonth, newDay) => {
        let item = getItemByDateAndIndex(itemDate, itemIndex);

        setIsLoading(true);
        setMessage(__('Moving the item...', 'publishpress'));

        const dataUrl = getUrl(props.actionMoveItem);

        const formData = new FormData();
        formData.append('id', item.id);
        formData.append('year', newYear);
        formData.append('month', newMonth);
        formData.append('day', newDay);

        const response = await fetch(dataUrl, {
            method: 'POST',
            body: formData
        });

        response.json().then(() => {
            loadDataByDate(firstDateToDisplay);
        });
    }

    const handleOnDropItemCallback = (event, ui) => {
        const $dayCell = $(event.target);
        const $item = $(ui.draggable[0]);
        const dateTime = getDateAsStringInWpFormat(new Date($item.data('datetime')));

        $(event.target).addClass('publishpress-calendar-loading');

        moveItemToNewDate(
            dateTime,
            $item.data('index'),
            $dayCell.data('year'),
            $dayCell.data('month'),
            $dayCell.data('day')
        );
    };

    const handleOnHoverCellCallback = (event, ui) => {
        resetCSSClasses();

        $(event.target).addClass('publishpress-calendar-day-hover');
    };

    const itemPopupIsOpenedById = (id) => {
        return id === openedItemId;
    }

    const initDraggable = () => {
        $('.publishpress-calendar-day-items li').draggable({
            zIndex: 99999,
            helper: 'clone',
            containment: '.publishpress-calendar table',
            start: (event, ui) => {
                // Do not drag the item if the popup is opened.
                if (itemPopupIsOpenedById($(event.target).data('id'))) {
                    return false;
                }

                $(event.target).addClass('ui-draggable-target');

                resetOpenedItem();
            },
            stop: (event, ui) => {
                $('.ui-draggable-target').removeClass('ui-draggable-target');
            }
        });

        $('.publishpress-calendar tbody > tr > td').droppable({
            drop: handleOnDropItemCallback,
            over: handleOnHoverCellCallback
        });
    };

    const onFilterEventCallback = (filterName, value) => {
        if ('status' === filterName) {
            setFilterStatus(value);
        }

        if ('category' === filterName) {
            setFilterCategory(value);
        }

        if ('tag' === filterName) {
            setFilterTag(value);
        }

        if ('author' === filterName) {
            setFilterAuthor(value);
        }

        if ('postType' === filterName) {
            setFilterPostType(value);
        }

        if ('weeks' === filterName) {
            value = parseInt(value);
            if (value === 0 || isNaN(value)) {
                value = props.numberOfWeeksToDisplay;
            }

            setFilterWeeks(value);
            setNumberOfWeeksToDisplay(value);

        }

        loadDataByDate(firstDateToDisplay, {filterName: filterName, filterValue: value});
    }

    const resetOpenedItem = () => {
        setOpenedItemId(null);
        setOpenedItemData(null);
    }

    const onClickItem = (e) => {
        setOpenedItemId(e.detail.id);
        setOpenedItemData(null);

        if (itemPopupIsOpenedById(e.detail.id)) {
            return false;
        }

        onRefreshItemPopup(e);
    }

    const onRefreshItemPopup = (e) => {
        fetchItemData(e.detail.id).then(fetchedData => {
            setOpenedItemId(e.detail.id);
            setOpenedItemData(fetchedData);
        });
    }

    const onDocumentKeyDown = (e) => {
        if (e.key === 'Escape') {
            resetOpenedItem();
        }
    }

    const getOpenedItemData = () => {
        return openedItemData;
    }

    const calendarBodyRows = () => {
        const numberOfDaysToDisplay = numberOfWeeksToDisplay * 7;
        const firstDate = getBeginDateOfWeekByDate(firstDateToDisplay);

        let tableRows = [];
        let rowCells = [];
        let dayIndexInTheRow = 0;
        let dayDate;
        let dateString;
        let lastMonthDisplayed = firstDate.getMonth();

        for (let dataIndex = 0; dataIndex < numberOfDaysToDisplay; dataIndex++) {
            if (dayIndexInTheRow === 0) {
                rowCells = [];
            }

            dayDate = new Date(firstDate);
            dayDate.setDate(dayDate.getDate() + dataIndex);
            dateString = getDateAsStringInWpFormat(dayDate);

            rowCells.push(
                <CalendarCell
                    key={'day-' + dayDate.getTime()}
                    date={dayDate}
                    shouldDisplayMonthName={lastMonthDisplayed !== dayDate.getMonth() || dataIndex === 0}
                    todayDate={props.todayDate}
                    isLoading={false}
                    items={itemsByDate[dateString] || []}
                    maxVisibleItems={props.maxVisibleItems}
                    timeFormat={props.timeFormat}
                    openedItemId={openedItemId}
                    getOpenedItemDataCallback={getOpenedItemData}
                    ajaxUrl={props.ajaxUrl}/>
            );

            dayIndexInTheRow++;

            if (dayIndexInTheRow === 7) {
                dayIndexInTheRow = 0;
                tableRows.push(
                    <tr>{rowCells}</tr>
                );
            }

            lastMonthDisplayed = dayDate.getMonth();
        }

        return tableRows;
    };

    React.useEffect(didMount, []);
    React.useEffect(initDraggable);

    return (
        <div className={'publishpress-calendar publishpress-calendar-theme-' + theme}>
            <FilterBar
                statuses={props.statuses}
                postTypes={props.postTypes}
                numberOfWeeksToDisplay={numberOfWeeksToDisplay}
                ajaxurl={props.ajaxUrl}
                nonce={props.nonce}
                onChange={onFilterEventCallback}/>

            <NavigationBar
                refreshOnClickCallback={handleRefreshOnClick}
                backPageOnClickCallback={handleBackPageOnClick}
                backOnClickCallback={handleBackOnClick}
                forwardOnClickCallback={handleForwardOnClick}
                forwardPageOnClickCallback={handleForwardPageOnClick}
                todayOnClickCallback={handleTodayOnClick}/>

            <table>
                <thead>
                <tr>
                    <WeekDays weekStartsOnSunday={props.weekStartsOnSunday}/>
                </tr>
                </thead>
                <tbody>
                {calendarBodyRows()}
                </tbody>
            </table>

            <MessageBar showSpinner={isLoading} message={message}/>
        </div>
    )
}
