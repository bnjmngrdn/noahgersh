"use client";

import { Box } from "@sanity/ui";
import { Component } from "react";
import { LibraryBatchUploadDialog } from "./library-batch-upload-dialog";
import { LibraryDefaultList } from "./library-default-list";

type PaneProps = {
  options?: {
    type?: string;
  };
};

type State = { batchOpen: boolean };

export class LibraryItemsPane extends Component<PaneProps, State> {
  state: State = { batchOpen: false };

  actionHandlers = {
    batchUpload: () => {
      this.setState({ batchOpen: true });
    },
  };

  render() {
    const type = this.props.options?.type ?? "libraryItem";

    return (
      <Box style={{ height: "100%" }}>
        <LibraryBatchUploadDialog
          open={this.state.batchOpen}
          onClose={() => this.setState({ batchOpen: false })}
        />
        <LibraryDefaultList type={type} />
      </Box>
    );
  }
}
